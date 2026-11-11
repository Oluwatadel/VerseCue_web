import {LicenseError} from './licensing-security';
export const MAX_TEST_AUDIO=20000000;
export function testReport(input:any){
 if(!input||input.version!==1||!input.consent||input.consent.recording!==true||input.consent.upload!==true||input.consent.version!=='1')throw new LicenseError(400,'Recording and reviewed-upload consent are required.');
 function text(value:unknown,max:number,required=false){if(value===undefined||value===null)value='';if(typeof value!=='string'||value.length>max||value.includes('\u0000')||(required&&!value.trim()))throw new LicenseError(400,'A test report field is missing or too long.');return value.trim();}
 function number(value:unknown,max:number):number;
 function number(value:unknown,max:number,nullable:true):number|null;
 function number(value:unknown,max:number,nullable=false):number|null{if(nullable&&(value===null||value===undefined))return null;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max)throw new LicenseError(400,'Invalid test timing or device measurement.');return value;}
 const shareTranscript=input.shareTranscript===true,training=input.consent.training===true;
 const audio=input.audio?{bytes:number(input.audio.bytes,MAX_TEST_AUDIO)!,sha256:text(input.audio.sha256,44,true)}:null;
 if(audio&&(!Number.isInteger(audio.bytes)||audio.bytes<46||!/^[A-Za-z0-9+/]{43}=$/.test(audio.sha256)))throw new LicenseError(400,'Invalid recording size or SHA-256 checksum.');
 if(training&&!shareTranscript&&!audio)throw new LicenseError(400,'Training permission requires sharing audio or transcript data.');
 function rows(value:any,max:number){if(!Array.isArray(value)||value.length>max)throw new LicenseError(400,'Too many test events.');return value;}
 const rawOutputs=rows(input.rawOutputs??[],1500).map((r:any)=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||!Number.isInteger(r.windowIndex)||r.windowIndex< -1||r.windowIndex>100000)throw new LicenseError(400,'Invalid raw speech event.');
  if(!shareTranscript&&r.text)throw new LicenseError(400,'Raw speech output cannot be sent without transcript consent.');
  return {windowIndex:r.windowIndex,atMs:number(r.atMs,1200000),processingMs:number(r.processingMs,1200000),filteredReason:['artifact','duplicate','dropped'].includes(r.filteredReason)?r.filteredReason:null,...(shareTranscript?{text:text(r.text,3000)}:{})};
 });
 const segments=rows(input.segments,1500).map((s:any)=>{
  if(!s||typeof s!=='object'||Array.isArray(s))throw new LicenseError(400,'Invalid transcript event.');
  if(!shareTranscript&&(s.text||s.correctedText))throw new LicenseError(400,'Transcript content cannot be sent without transcript consent.');
  return {id:text(s.id,64,true),atMs:number(s.atMs,1200000),audioMs:number(s.audioMs,600000,true),queueMs:number(s.queueMs,1200000,true),decodeMs:number(s.decodeMs,1200000,true),...(shareTranscript?{text:text(s.text,3000),correctedText:text(s.correctedText,3000)}:{})};
 });
 const detections=rows(input.detections,1500).map((d:any)=>{
  if(!d||typeof d!=='object'||Array.isArray(d))throw new LicenseError(400,'Invalid detection event.');
  if(!shareTranscript&&(d.inputText||d.reference))throw new LicenseError(400,'Detection content cannot be sent without transcript consent.');
  return {segmentId:text(d.segmentId,64),atMs:number(d.atMs,1200000),pipelineMs:number(d.pipelineMs,1200000),matched:d.matched===true,paraphrase:d.paraphrase===true,llm:d.llm===true,error:d.error===true,...(shareTranscript?{inputText:text(d.inputText,3000),reference:text(d.reference,160)}:{})};
 });
 const profile={title:text(input.title,120,true),accent:text(input.accent,80),language:text(input.language,60),notes:text(input.notes,2000),expectedReferences:text(input.expectedReferences,500),environment:text(input.environment,80),platform:text(input.platform,40,true),osVersion:text(input.osVersion,120),architecture:text(input.architecture,30),processors:number(input.processors,1024),memoryMb:number(input.memoryMb,2097152),appVersion:text(input.appVersion,80),speechModel:text(input.speechModel,80),durationMs:number(input.durationMs,600000),droppedWindows:number(input.droppedWindows??0,100000)};
 return {version:1,...profile,shareTranscript,consent:{version:'1',recording:true,upload:true,training},audio,rawOutputs,segments,detections};
}
export function testSummary(report:ReturnType<typeof testReport>){
 function percentile(values:(number|null)[],q:number){const v=values.filter((n):n is number=>n!==null).sort((a,b)=>a-b);return v.length?Math.round(v[Math.max(0,Math.ceil(v.length*q)-1)]):null;}
 const stages=new Map(report.segments.map(s=>[s.id,s]));
 const estimated=report.detections.map(d=>{const s=stages.get(d.segmentId);return s&&s.audioMs!==null&&s.decodeMs!==null&&s.queueMs!==null?s.audioMs+s.queueMs+s.decodeMs+d.pipelineMs:null;});
 return {droppedWindows:report.droppedWindows,rawOutputs:report.rawOutputs.length,segments:report.segments.length,attempts:report.detections.length,matches:report.detections.filter(d=>d.matched).length,corrections:report.segments.filter(s=>'correctedText'in s&&s.correctedText).length,decodeP50:percentile(report.segments.map(s=>s.decodeMs),.5),decodeP95:percentile(report.segments.map(s=>s.decodeMs),.95),pipelineP95:percentile(report.detections.map(d=>d.pipelineMs),.95),estimatedP95:percentile(estimated,.95)};
}
