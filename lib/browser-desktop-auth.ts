import {randomBytes,createHash,createCipheriv,createDecipheriv} from 'node:crypto';
import {LicensingService} from './licensing-service';
import {LicenseError,hash} from './licensing-security';
import type {LicensingDb} from './licensing-db';
export class BrowserDesktopAuth {
 constructor(private db:LicensingDb,private licensing:LicensingService){}
 async start(device:unknown){
  await this.licensing.rate('browser-desktop-start',300);
  const d=await this.licensing.browserDevice(device),code=randomBytes(32).toString('hex'),userCode=randomBytes(5).toString('hex').toUpperCase();
  await this.db.query('DELETE FROM vc_desktop_auth WHERE expires_at<now()');
  await this.db.query('INSERT INTO vc_desktop_auth(code_hash,user_code,device) VALUES($1,$2,$3::jsonb)',[hash(code),userCode,JSON.stringify(d)]);
  return {code,userCode,expiresIn:600,interval:3,path:'/account/connect-desktop?code='+userCode};
 }
 private code(value:unknown){if(typeof value!=='string'||!/^[A-F0-9]{10}$/.test(value))throw new LicenseError(400,'Enter the ten-character code shown in the desktop app.');return value;}
 async info(userCode:unknown){const [row]=await this.db.query('SELECT device,account_id FROM vc_desktop_auth WHERE user_code=$1 AND expires_at>now()',[this.code(userCode)]);if(!row)throw new LicenseError(410,'This desktop sign-in expired. Start again in the app.');return {name:row.device.name,id:row.device.id,approved:!!row.account_id};}
 async approve(token:string,userCode:unknown){
  const account=await this.licensing.account(token);if(account.session_kind!=='web')throw new LicenseError(401,'Sign in on the website.');
  await this.licensing.rate('browser-approve:'+account.id,20);
  if(!account.organisation_name?.trim())throw new LicenseError(400,'Add your organisation name before connecting.');
  const rows=await this.db.query('UPDATE vc_desktop_auth SET account_id=$2 WHERE user_code=$1 AND account_id IS NULL AND expires_at>now() RETURNING user_code',[this.code(userCode),account.id]);
  if(!rows.length)throw new LicenseError(409,'This sign-in was already approved or expired. Start again in the desktop app.');return {approved:true};
 }
 async poll(code:unknown,device:unknown){
  if(typeof code!=='string'||!/^[a-f0-9]{64}$/.test(code))throw new LicenseError(400,'Invalid desktop sign-in.');
  const [row]=await this.db.query('SELECT * FROM vc_desktop_auth WHERE code_hash=$1 AND expires_at>now()',[hash(code)]);if(!row)throw new LicenseError(410,'Desktop sign-in expired. Start again.');
  const d=await this.licensing.browserDevice(device);if(d.id!==row.device.id||d.publicKey!==row.device.publicKey)throw new LicenseError(403,'This sign-in belongs to another computer.');
  if(row.result){const key=createHash('sha256').update(code).digest(),decrypt=createDecipheriv('aes-256-gcm',key,Buffer.from(row.result.iv,'base64'));decrypt.setAuthTag(Buffer.from(row.result.tag,'base64'));const cached=JSON.parse(Buffer.concat([decrypt.update(Buffer.from(row.result.data,'base64')),decrypt.final()]).toString()),account=await this.licensing.account(cached.session);if(account.session_kind!=='free'||account.session_device!==d.id)throw new LicenseError(401,'This desktop sign-in was revoked. Start again.');return {complete:true,...cached};}
  if(!row.account_id)return {complete:false};
  const claimed=await this.db.query('UPDATE vc_desktop_auth SET claimed=true WHERE code_hash=$1 AND claimed=false RETURNING account_id',[hash(code)]);if(!claimed.length)return {complete:false};
  try{
   const result=await this.licensing.browserDesktopLogin(row.account_id,d),key=createHash('sha256').update(code).digest(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),data=Buffer.concat([cipher.update(JSON.stringify(result)),cipher.final()]);
   await this.db.query('UPDATE vc_desktop_auth SET result=$2::jsonb WHERE code_hash=$1',[hash(code),JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')})]);
   return {complete:true,...result};
  }catch(error){await this.db.query('UPDATE vc_desktop_auth SET claimed=false WHERE code_hash=$1 AND result IS NULL',[hash(code)]);throw error;}
 }
}
