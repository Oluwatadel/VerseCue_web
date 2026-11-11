import {randomUUID} from 'node:crypto';
import type {LicensingDb,Row} from './licensing-db';
import {LicenseError,hash} from './licensing-security';
import {testReport,testSummary} from './test-report-format';
import {PrivateTestAudio,type TestAudioStorage} from './test-report-storage';
export class TestReports {
 constructor(private db:LicensingDb,private storage:TestAudioStorage=new PrivateTestAudio()){}
 private id(value:unknown){const id=String(value||'');if(!/^[a-f0-9-]{36}$/i.test(id))throw new LicenseError(400,'Invalid test report.');return id;}
 private async row(id:unknown,accountId?:string){const [row]=await this.db.query('SELECT * FROM vc_test_reports WHERE id=$1'+(accountId?' AND account_id=$2':''),[this.id(id),...accountId?[accountId]:[]]);if(!row)throw new LicenseError(404,'Test report not found.');return row;}
 async prepare(accountId:string,clientId:unknown,input:unknown){
  if(typeof clientId!=='string'||!/^[a-f0-9]{64}$/.test(clientId))throw new LicenseError(400,'A stable report upload identifier is required.');
  const report=testReport(input),payload=JSON.stringify(report),digest=hash(payload),summary=testSummary(report);
  if(Buffer.byteLength(payload)>500000)throw new LicenseError(413,'The reviewed report is too large. Capture a shorter session.');
  if(report.audio&&!this.storage.configured)throw new LicenseError(503,'Private recording storage is not configured. Uncheck audio to share timing data, or contact your administrator.');
  const [existing]=await this.db.query('SELECT * FROM vc_test_reports WHERE account_id=$1 AND client_id=$2',[accountId,clientId]);
  let row=existing;
  if(!row){
   const [count]=await this.db.query("SELECT count(*)::int AS total FROM vc_test_reports WHERE account_id=$1 AND created_at>now()-interval '1 day'",[accountId]);
   if(count.total>=10)throw new LicenseError(429,'You can share up to ten test reports per day.');
   const id=randomUUID(),key=report.audio?'test-reports/'+accountId+'/'+id+'.wav':null;
   const inserted=await this.db.query(`INSERT INTO vc_test_reports(id,account_id,client_id,payload_hash,payload,title,accent,platform,summary,share_transcript,training_consent,audio_key,audio_bytes,audio_sha256,state)
    VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15) ON CONFLICT(account_id,client_id) DO NOTHING RETURNING *`,
    [id,accountId,clientId,digest,payload,report.title,report.accent,report.platform,JSON.stringify(summary),report.shareTranscript,report.consent.training,key,report.audio?.bytes??null,report.audio?.sha256??null,report.audio?'uploading':'ready']);
   row=inserted[0]||(await this.db.query('SELECT * FROM vc_test_reports WHERE account_id=$1 AND client_id=$2',[accountId,clientId]))[0];
  }
  if(row.payload_hash!==digest)throw new LicenseError(409,'The report changed. Review it and create a new submission.');
  if(!['ready','uploading'].includes(row.state)||new Date(row.expires_at).getTime()<=Date.now())throw new LicenseError(409,'This report was deleted or expired. Create a new submission.');
  return {id:row.id,complete:row.state==='ready',expiresAt:row.expires_at,upload:row.state==='uploading'?await this.storage.prepare(row.audio_key,row.audio_bytes,row.audio_sha256):null};
 }
 async complete(id:unknown,accountId:string){
  const row=await this.row(id,accountId);if(row.state==='ready')return {id:row.id,complete:true};
  if(row.state!=='uploading'||new Date(row.expires_at).getTime()<=Date.now())throw new LicenseError(409,'This upload is no longer available.');
  try{await this.storage.verify(row.audio_key,row.audio_bytes,row.audio_sha256);}catch(error){if(error instanceof LicenseError)throw error;throw new LicenseError(409,'Recording upload is incomplete or could not be verified. Retry it.');}
  const ready=await this.db.query("UPDATE vc_test_reports SET state='ready' WHERE id=$1 AND account_id=$2 AND state='uploading' RETURNING id",[row.id,accountId]);
  if(!ready.length)throw new LicenseError(409,'This report was withdrawn while uploading.');return {id:row.id,complete:true};
 }
 async list(accountId?:string){
  const reports=await this.db.query(`SELECT r.id,r.title,r.accent,r.platform,r.payload->>'speechModel' AS speech_model,r.summary,r.training_consent,r.share_transcript,r.review_state,r.created_at,r.expires_at,(r.audio_key IS NOT NULL) AS has_audio,a.email,a.organisation_name
   FROM vc_test_reports r JOIN vc_accounts a ON a.id=r.account_id WHERE r.state='ready' AND r.expires_at>now() ${accountId?'AND r.account_id=$1':''} ORDER BY r.created_at DESC LIMIT 100`,accountId?[accountId]:[]);
  const groups=accountId?[]:await this.db.query(`SELECT platform,accent,payload->>'speechModel' AS speech_model,count(*)::int AS sessions,avg((summary->>'decodeP95')::float8) AS decode_ms,avg((summary->>'pipelineP95')::float8) AS pipeline_ms
   FROM vc_test_reports WHERE state='ready' AND expires_at>now() GROUP BY platform,accent,3 ORDER BY count(*) DESC LIMIT 30`);
  return {reports,groups,audioConfigured:this.storage.configured,retentionDays:30};
 }
 async detail(id:unknown,accountId?:string){const row=await this.row(id,accountId);if(row.state!=='ready'||new Date(row.expires_at).getTime()<=Date.now())throw new LicenseError(404,'Test report is unavailable or expired.');return {id:row.id,report:row.payload,summary:row.summary,reviewState:row.review_state,trainingConsent:row.training_consent,expiresAt:row.expires_at,hasAudio:!!row.audio_key};}
 async audio(id:unknown,accountId?:string){const row=await this.row(id,accountId);await this.detail(id,accountId);if(!row.audio_key)throw new LicenseError(404,'Audio was not shared.');const seconds=Math.max(1,Math.min(60,Math.floor((new Date(row.expires_at).getTime()-Date.now())/1000)));return {url:await this.storage.read(row.audio_key,seconds),expiresIn:seconds};}
 async review(id:unknown,state:unknown){if(!['reviewed','excluded'].includes(String(state)))throw new LicenseError(400,'Choose reviewed or excluded.');await this.detail(id);await this.db.query('UPDATE vc_test_reports SET review_state=$2 WHERE id=$1',[this.id(id),state]);return {message:'Review state saved.'};}
 async trainingExport(id:unknown){
  const row=await this.row(id);await this.detail(id);
  if(!row.training_consent)throw new LicenseError(403,'This tester allowed diagnostics only. Model-training export is not permitted.');
  if(row.review_state!=='reviewed')throw new LicenseError(409,'Review and approve this sample before exporting training annotations.');
  const snippets=row.payload.segments.filter((s:any)=>typeof s.correctedText==='string'&&s.correctedText.trim()).map((s:any)=>({id:s.id,atMs:s.atMs,audioMs:s.audioMs,modelText:s.text,verifiedText:s.correctedText}));
  if(!snippets.length)throw new LicenseError(409,'Verified transcript text is required for training export.');
  return {version:1,purpose:'model-training',sourceReportId:row.id,permissionRecordedAt:row.consented_at,expiresAt:row.expires_at,platform:row.payload.platform,accent:row.payload.accent,language:row.payload.language,speechModel:row.payload.speechModel,hasAudio:!!row.audio_key,snippets};
 }
 async remove(id:unknown,accountId?:string){
  const row=await this.row(id,accountId);if(row.state==='deleted')return {deleted:true};
  await this.db.query("UPDATE vc_test_reports SET state='deleting',payload='{}'::jsonb,summary='{}'::jsonb,title='Deleted report',accent='',training_consent=false WHERE id=$1",[row.id]);
  try{if(row.audio_key)await this.storage.remove(row.audio_key);}catch{return {deleted:false,pending:true,message:'The report is hidden. Private audio deletion is queued for retry.'};}
  await this.db.query("UPDATE vc_test_reports SET state='deleted',audio_key=NULL,audio_bytes=NULL,audio_sha256=NULL,deleted_at=now() WHERE id=$1",[row.id]);return {deleted:true};
 }
 async cleanup(){const rows=await this.db.query("SELECT id FROM vc_test_reports WHERE state='deleting' OR (state IN ('ready','uploading') AND (expires_at<=now() OR (state='uploading' AND created_at<now()-interval '1 day'))) LIMIT 50");let deleted=0,pending=0;for(const row of rows){const result=await this.remove(row.id);if(result.deleted)deleted++;else pending++;}return {testReportsDeleted:deleted,testReportsDeletionPending:pending};}
}
