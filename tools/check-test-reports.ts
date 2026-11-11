import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {readdir,readFile} from 'node:fs/promises';
import {TestReports} from '../lib/test-reports';
import {testReport,testSummary} from '../lib/test-report-format';
import {PrivateTestAudio,validateTestWavHeader,type TestAudioStorage} from '../lib/test-report-storage';
import {LicenseError,hash} from '../lib/licensing-security';
import type {LicensingDb,Statement} from '../lib/licensing-db';
async function main(){let checks=0;function check(value:unknown,name:string){assert.ok(value,name);checks++;console.log('PASS '+name);}async function reject(work:()=>unknown,status:number,name:string){await assert.rejects(async()=>work(),(e:any)=>e instanceof LicenseError&&e.status===status);check(true,name);}
 const pg=new PGlite();try{
 for(const file of(await readdir('db')).filter(f=>/^\d+.*\.sql$/.test(f)).sort())await pg.exec(await readFile('db/'+file,'utf8'));
 const db:LicensingDb={query:async(text,values=[]) => (await pg.query(text,values)).rows as any[],transaction:async(items:Statement[])=>pg.transaction(async tx=>{const result:any[]=[];for(const item of items)result.push((await tx.query(item.text,item.values||[])).rows);return result;})};
 const ids=[randomUUID(),randomUUID(),randomUUID()];for(const[id,index]of ids.map((id,index)=>[id,index] as const))await db.query("INSERT INTO vc_accounts(id,email,password_hash,organisation_name) VALUES($1,$2,'fixture','Test Church')",[id,'tester'+index+'@example.invalid']);
 class Audio implements TestAudioStorage{configured=true;verified=false;failDelete=false;reads=0;deletes=0;expected:any;async prepare(key:string,bytes:number,sha256:string){this.expected={key,bytes,sha256};return{url:'https://private.example.invalid/upload',headers:{'Content-Type':'audio/wav','x-amz-checksum-sha256':sha256}};}async verify(key:string,bytes:number,sha256:string){assert.deepEqual({key,bytes,sha256},this.expected);if(!this.verified)throw new LicenseError(409,'Not uploaded');}async read(key:string,seconds:number){assert.ok(seconds<=60&&seconds>0);assert.ok(key.startsWith('test-reports/'));this.reads++;return 'https://private.example.invalid/signed-read';}async remove(){if(this.failDelete)throw new Error('Temporary storage failure');this.deletes++;}}
 const audio=new Audio(),service=new TestReports(db,audio),cid=()=>hash(randomUUID());
 function report(extra:any={}){return{version:1,title:'Accent speed test',accent:'Self-reported accent',language:'English',notes:'A quiet room',expectedReferences:'',environment:'Quiet room',platform:'Windows',osVersion:'Windows test',architecture:'X64',processors:4,memoryMb:8192,appVersion:'test-build',speechModel:'VerseCue Clarity',durationMs:5000,shareTranscript:false,consent:{version:'1',recording:true,upload:true,training:false},audio:null,segments:[{id:'segment-1',atMs:2000,audioMs:2000,queueMs:10,decodeMs:700}],detections:[{segmentId:'segment-1',atMs:2100,pipelineMs:20,matched:true,paraphrase:false,llm:false,error:false}],...extra};}
 await reject(()=>service.prepare(ids[0],cid(),report({consent:{recording:false,upload:true,version:'1'}})),400,'recording consent is required');
 await reject(()=>service.prepare(ids[0],cid(),report({consent:{recording:true,upload:false,version:'1'}})),400,'reviewed upload consent is required');
 await reject(()=>service.prepare(ids[0],cid(),report({segments:[{text:'private sermon'}]})),400,'timing-only consent cannot carry hidden transcript content');
 await reject(()=>service.prepare(ids[0],cid(),report({detections:[{reference:'John 3:16'}]})),400,'timing-only consent cannot carry hidden detected references');
 await reject(()=>service.prepare(ids[0],cid(),report({consent:{version:'1',recording:true,upload:true,training:true}})),400,'metrics-only reports cannot silently enable model training');
 const noAudio=new Audio();noAudio.configured=false;const metrics=new TestReports(db,noAudio),client=cid();
 const saved=await metrics.prepare(ids[0],client,report({secretToken:'must-not-store'}));check(saved.complete&&!saved.upload,'timing reports work without audio storage or media upload');
 const again=await metrics.prepare(ids[0],client,report({secretToken:'must-not-store'}));check(again.id===saved.id,'preparation retries are idempotent for identical reviewed content');
 await reject(()=>metrics.prepare(ids[0],client,report({notes:'changed'})),409,'one upload identifier cannot silently replace reviewed content');
 const detail=await metrics.detail(saved.id,ids[0]);check(!JSON.stringify(detail).includes('must-not-store')&&!JSON.stringify(detail).includes('secretToken'),'only allowlisted fields reach stored reports');
 await reject(()=>service.trainingExport(saved.id),403,'diagnostics-only reports cannot be exported for model training');
 check(detail.trainingConsent===false&&detail.report.segments[0].text===undefined,'diagnostics-only sharing keeps training permission off and text absent');
 check(detail.summary.estimatedP95===2730&&detail.summary.pipelineP95===20,'buffer, queue, decode and correlated detection stages are measured separately');
 check(testSummary(testReport(report({segments:[{id:'segment-1',atMs:2000,audioMs:null,queueMs:null,decodeMs:null}]}))).estimatedP95===null,'unknown engine measurements are not reported as zero latency');
 const sha=randomBytes(32).toString('base64'),withAudio=report({audio:{bytes:32044,sha256:sha}});
 await reject(()=>metrics.prepare(ids[0],cid(),withAudio),503,'audio collection stays disabled until private storage is configured');
 const prepared=await service.prepare(ids[0],cid(),withAudio);check(!prepared.complete&&prepared.upload,'audio is prepared for a private direct upload');
 check(!(await service.list()).reports.some(r=>r.id===prepared.id),'unfinished recordings never appear in the admin queue');
 await reject(()=>service.detail(prepared.id),404,'unfinished audio report cannot be reviewed');
 await reject(()=>service.complete(prepared.id,ids[0]),409,'completion requires verified recording bytes and checksum');
 audio.verified=true;await service.complete(prepared.id,ids[0]);check((await service.detail(prepared.id)).hasAudio,'verified upload becomes available to reviewers');
 check((await service.complete(prepared.id,ids[0])).complete,'lost completion acknowledgment can be retried safely');
 await reject(()=>service.detail(prepared.id,ids[1]),404,'another account cannot read the report');
 await reject(()=>service.audio(prepared.id,ids[1]),404,'another account cannot get its audio link');
 await reject(()=>service.remove(prepared.id,ids[1]),404,'another account cannot withdraw the report');
 check((await service.audio(prepared.id,ids[0])).url.startsWith('https://private.'),'authorized audio links are short-lived and private');
 const list=await service.list();check(!JSON.stringify(list).includes('audio_key')&&!JSON.stringify(list).includes('sha256'),'report lists do not expose storage keys or recording checksums');
 const words=report({shareTranscript:true,consent:{version:'1',recording:true,upload:true,training:true},segments:[{id:'x',atMs:1,audioMs:2000,queueMs:0,decodeMs:600,text:'Third John too',correctedText:'Third John two'}],detections:[]});
 const annotated=await service.prepare(ids[0],cid(),words);const annotatedDetail=await service.detail(annotated.id);check(annotatedDetail.trainingConsent&&annotatedDetail.summary.corrections===1,'optional training permission and corrected ground truth are retained explicitly');
 await reject(()=>service.trainingExport(annotated.id),409,'training export requires administrator review');await service.review(annotated.id,'reviewed');const training=await service.trainingExport(annotated.id);check(training.snippets[0].verifiedText==='Third John two'&&!JSON.stringify(training).includes('email'),'training export includes verified annotations without account identifiers');
 await service.review(annotated.id,'excluded');check((await service.detail(annotated.id)).reviewState==='excluded','reviewer can exclude a submitted sample from training');await reject(()=>service.trainingExport(annotated.id),409,'excluded samples are blocked from training export');
 audio.failDelete=true;const removal=await service.remove(prepared.id,ids[0]);check(removal.pending,'storage deletion failures are queued instead of falsely reported complete');
 await reject(()=>service.audio(prepared.id,ids[0]),404,'withdrawal immediately removes recording access');
 const [hidden]=await db.query('SELECT payload,training_consent,state FROM vc_test_reports WHERE id=$1',[prepared.id]);check(hidden.state==='deleting'&&Object.keys(hidden.payload).length===0&&!hidden.training_consent,'withdrawal clears transcript and training permission before storage retry');
 audio.failDelete=false;check((await service.cleanup()).testReportsDeleted===1,'background cleanup retries the private recording deletion');
 await db.query("UPDATE vc_test_reports SET expires_at=now()-interval '1 second' WHERE id=$1",[annotated.id]);await reject(()=>service.detail(annotated.id),404,'expired reports cannot be reviewed');
 check(!(await service.list()).reports.some(r=>r.id===annotated.id),'expired reports disappear from analysis');await service.cleanup();
 for(let i=0;i<10;i++)await metrics.prepare(ids[2],cid(),report());await reject(()=>metrics.prepare(ids[2],cid(),report()),429,'per-account daily upload limits prevent unlimited collection');
 try{const native=JSON.parse(await readFile('../VerseCue/artifacts/test-reports-native/payload.json','utf8'));check(testReport(native).rawOutputs.length>0,'actual C# review payload validates in the Node service');const fixture=await readFile('../VerseCue/artifacts/test-reports-native/fixture.wav');validateTestWavHeader(fixture.subarray(0,1024),fixture.length);check(true,'actual NAudio-generated WAV passes server format verification');}catch(error:any){if(error.code!=='ENOENT')throw error;}
 const signed=new PrivateTestAudio({TEST_AUDIO_BUCKET:'test-private-bucket',TEST_AUDIO_REGION:'us-east-1',TEST_AUDIO_ACCESS_KEY_ID:'fixture-access-key',TEST_AUDIO_SECRET_ACCESS_KEY:'fixture-secret-never-use'});
 const signedUpload=await signed.prepare('test-reports/fixture.wav',32044,sha),url=new URL(signedUpload.url),headers=url.searchParams.get('X-Amz-SignedHeaders')||'';
 check(headers.includes('content-length')&&headers.includes('content-type')&&headers.includes('x-amz-checksum-sha256'),'private upload signature binds exact length, audio type and SHA-256 header');
 check(!signedUpload.url.includes('fixture-secret-never-use')&&url.searchParams.get('X-Amz-Expires')==='900','private credentials stay server-side and uploads expire in 15 minutes');
 const wav=Buffer.alloc(44);wav.write('RIFF');wav.writeUInt32LE(32036,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(32000,40);
 validateTestWavHeader(wav,32044);check(true,'standard mono PCM16 recordings pass format validation');wav.writeUInt16LE(2,22);await reject(()=>validateTestWavHeader(wav,32044),400,'unexpected audio formats cannot be published as verified test recordings');
 console.log(checks+' test-report privacy, retention and upload checks passed. No real recordings, object-store requests or emails were sent.');
 }finally{await pg.close();}}
main().catch(error=>{console.error(error);process.exitCode=1;});
