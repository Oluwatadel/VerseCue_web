import {randomUUID} from 'node:crypto';
import type {LicensingDb,Row} from './licensing-db';
import {LicensingService} from './licensing-service';
import {EmailService} from './email-service';
import {LicenseError,hash} from './licensing-security';
export class ActivationDelivery{
 constructor(private db:LicensingDb,private licensing:LicensingService,private mail=new EmailService(db)){}
 private active(account:Row){return account.licenses.some((l:Row)=>l.status==='active'&&(!l.expires_at||new Date(l.expires_at).getTime()>Date.now()));}
 private deviceAccess(account:Row,deviceId:string){return account.licenses.some((l:Row)=>l.status==='active'&&(!l.expires_at||new Date(l.expires_at).getTime()>Date.now())&&(!l.device_id||l.device_id===deviceId));}
 private async web(token:string){const account=await this.licensing.account(token);if(account.session_kind!=='web')throw new LicenseError(401,'Sign in on the website to choose activation.');return account;}
 private async devices(account:Row){const rows=await this.db.query(`SELECT c.device_id,c.device_name FROM vc_organisation_devices c
 JOIN vc_organisation_members m ON m.organisation_id=c.organisation_id AND m.account_id=c.account_id JOIN vc_organisations o ON o.id=c.organisation_id
 WHERE c.account_id=$1 AND c.status='active' AND m.status='approved' AND o.status='active' AND o.multi_device`,[account.id]);
 const devices=new Map<string,string>();if(account.device_id)devices.set(account.device_id,account.device_name||'Registered computer');for(const row of rows)devices.set(row.device_id,row.device_name||'Organisation computer');return [...devices].map(([id,name])=>({id,name}));}
 async state(token:string,id?:string){const account=await this.web(token);let request=null;if(id){const [row]=await this.db.query('SELECT id,status,expires_at,device_id FROM vc_activation_requests WHERE id::text=$1 AND account_id=$2',[id,account.id]);if(!row)throw new LicenseError(404,'Activation request not found.');request={id:row.id,expiresAt:row.expires_at,status:row.status==='pending'&&!this.active(account)?'access-ended':row.status==='pending'&&new Date(row.expires_at).getTime()<=Date.now()?'expired':row.status};}
 return {active:this.active(account),email:account.email,devices:await this.devices(account),request};}
 async connect(token:string,deviceId:unknown){const account=await this.web(token);if(!this.active(account))throw new LicenseError(403,'Verified paid or complimentary AI access is required. Test payments do not activate AI.');this.licensing.requireActivationConfiguration();
 if(!(await this.devices(account)).some(d=>d.id===deviceId))throw new LicenseError(409,'Open verseVIO and sign in with this account on the computer you want to activate.');if(!this.deviceAccess(account,String(deviceId)))throw new LicenseError(403,'AI access is not available for the selected computer. Check its subscription or organisation membership.');await this.licensing.rate('connect-ai:'+account.id,10);
 await this.db.query("UPDATE vc_activation_requests SET status='expired' WHERE account_id=$1 AND status='pending' AND expires_at<=now()",[account.id]);
 const [request]=await this.db.query(`INSERT INTO vc_activation_requests(id,account_id,device_id) VALUES($1,$2,$3)
 ON CONFLICT(account_id,device_id) WHERE status='pending' DO UPDATE SET device_id=EXCLUDED.device_id RETURNING id,expires_at`,[randomUUID(),account.id,deviceId]);return {id:request.id,expiresAt:request.expires_at,message:'Waiting for the signed-in desktop app. Keep verseVIO open and connected to the internet.'};}
 async pending(token:string){const {active,account}=await this.licensing.desktopAiContext(token);if(!active)return {active:false,requestId:null};const [row]=await this.db.query("SELECT id FROM vc_activation_requests WHERE account_id=$1 AND device_id=$2 AND status='pending' AND expires_at>now()",[account.id,account.session_device]);return {active:true,requestId:row?.id||null};}
 async confirm(token:string,id:unknown,proof:unknown){const {account,device}=await this.licensing.activationDevice(token,proof);if(!this.deviceAccess(account,device.id))throw new LicenseError(403,'AI access is no longer active on this computer.');const [row]=await this.db.query("UPDATE vc_activation_requests SET status='activated',confirmed_at=now() WHERE id::text=$1 AND account_id=$2 AND device_id=$3 AND status IN ('pending','activated') AND expires_at>now() RETURNING id",[String(id||''),account.id,device.id]);if(!row)throw new LicenseError(409,'Activation request expired or belongs to another computer.');return {confirmed:true};}
 async emailKey(_token:string):Promise<any>{throw new LicenseError(410,'Activation keys are no longer used. Sign in to the desktop app with your account and choose Check activation now.');}
 async redeem(_token:string,_value:unknown,_proof:unknown):Promise<any>{throw new LicenseError(410,'Activation keys are no longer used. Sign in to the desktop app with your account and choose Check activation now.');}
}
