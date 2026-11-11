import {S3Client,PutObjectCommand,HeadObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {LicenseError} from './licensing-security';
export interface TestAudioStorage {
 readonly configured:boolean;
 prepare(key:string,bytes:number,sha256:string):Promise<{url:string;headers:Record<string,string>}>;
 verify(key:string,bytes:number,sha256:string):Promise<void>;
 read(key:string,seconds:number):Promise<string>;
 remove(key:string):Promise<void>;
}
export class PrivateTestAudio implements TestAudioStorage {
 private client?:S3Client;private bucket='';readonly configured:boolean;
 constructor(env:Record<string,string|undefined>=process.env){
  this.bucket=env.TEST_AUDIO_BUCKET||'';
  this.configured=!!(this.bucket&&env.TEST_AUDIO_ACCESS_KEY_ID&&env.TEST_AUDIO_SECRET_ACCESS_KEY&&env.TEST_AUDIO_REGION);
  if(!this.configured)return;
  const endpoint=env.TEST_AUDIO_ENDPOINT;
  if(endpoint){const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new LicenseError(503,'Private test audio storage needs a secure endpoint.');}
  this.client=new S3Client({endpoint,region:env.TEST_AUDIO_REGION,forcePathStyle:env.TEST_AUDIO_PATH_STYLE==='1',credentials:{accessKeyId:env.TEST_AUDIO_ACCESS_KEY_ID!,secretAccessKey:env.TEST_AUDIO_SECRET_ACCESS_KEY!},requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'});
 }
 private require(){if(!this.client)throw new LicenseError(503,'Private audio storage is not configured. You can share timing data without audio, or contact your administrator.');return this.client;}
 async prepare(key:string,bytes:number,sha256:string){
  const command=new PutObjectCommand({Bucket:this.bucket,Key:key,ContentType:'audio/wav',ContentLength:bytes,ChecksumSHA256:sha256});
  const url=await getSignedUrl(this.require(),command,{expiresIn:900,signableHeaders:new Set(['content-type','content-length']),unhoistableHeaders:new Set(['x-amz-checksum-sha256'])});
  return {url,headers:{'Content-Type':'audio/wav','x-amz-checksum-sha256':sha256}};
 }
 async verify(key:string,bytes:number,sha256:string){
  const client=this.require(),head=await client.send(new HeadObjectCommand({Bucket:this.bucket,Key:key,ChecksumMode:'ENABLED'}));
  if(head.ContentLength!==bytes||head.ChecksumSHA256!==sha256||head.ContentType!=='audio/wav')throw new LicenseError(409,'The uploaded recording failed its size or checksum check. Retry the upload.');
  const object=await client.send(new GetObjectCommand({Bucket:this.bucket,Key:key,Range:'bytes=0-1023'}));
  const header=Buffer.from(await object.Body!.transformToByteArray());
  validateTestWavHeader(header,bytes);
 }
 async read(key:string,seconds:number){return getSignedUrl(this.require(),new GetObjectCommand({Bucket:this.bucket,Key:key,ResponseContentType:'audio/wav',ResponseContentDisposition:'inline; filename="versecue-test-recording.wav"'}),{expiresIn:Math.max(1,Math.min(60,seconds))});}
 async remove(key:string){await this.require().send(new DeleteObjectCommand({Bucket:this.bucket,Key:key}));}
}

export function validateTestWavHeader(header:Buffer,bytes:number){
  if(header.length<44||header.toString('ascii',0,4)!=='RIFF'||header.toString('ascii',8,12)!=='WAVE'||header.readUInt32LE(4)+8!==bytes)throw new LicenseError(400,'Only PCM WAV test recordings are accepted.');
  let position=12,format=false,data=false;
  while(position+8<=header.length){
   const tag=header.toString('ascii',position,position+4),length=header.readUInt32LE(position+4);position+=8;
   if(tag==='fmt '&&length>=16&&position+16<=header.length)format=header.readUInt16LE(position)===1&&header.readUInt16LE(position+2)===1&&header.readUInt32LE(position+4)===16000&&header.readUInt16LE(position+14)===16&&header.readUInt32LE(position+8)===32000&&header.readUInt16LE(position+12)===2;
   if(tag==='data'){data=length>0&&length%2===0&&length<=19200000&&position+length===bytes;break;}
   position+=length+(length%2);
  }
  if(!format||!data)throw new LicenseError(400,'The recording must be mono 16 kHz PCM16 WAV, up to ten minutes.');
}
