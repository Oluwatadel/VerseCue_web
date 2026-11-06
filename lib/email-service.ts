import {emailRejection} from './email-errors';
import type {LicensingDb} from "./licensing-db";
import {CURRENT_SUBSCRIPTION_NOTICE} from './subscription-policy';
import {SubscriptionLifecycle} from './subscription-lifecycle';
import {siteOrigin} from "./billing-plans";
export class EmailService {
 constructor(private db:LicensingDb,private key=process.env.RESEND_API_KEY||"",private from=process.env.EMAIL_FROM||"",private request:typeof fetch=fetch){this.key=key.trim();this.from=from.trim();}
 get configured(){return !!this.key&&/^[^\r\n]+@[^\r\n]+$/.test(this.from);}
 async queue(id:string,accountId:string|null,email:string,subject:string,text:string){await this.db.query("INSERT INTO vc_email_outbox(id,account_id,recipient,subject,text_body) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING",[id,accountId,email,subject,text]);}
 async welcome(account:{id:string;email:string;organisation_name:string}){return this.queue("welcome:"+account.id,account.id,account.email,"Welcome to VerseCue",`Welcome, ${account.organisation_name}. Your free account is ready. Download VerseCue at ${siteOrigin()}/download. AI assistance is optional and can be activated later.`);}
 async dispatch(limit=5,onlyId:string|null=null){
  await this.db.query(`UPDATE vc_email_outbox mail SET state='cancelled',text_body='' WHERE activation_license_id IS NOT NULL AND state='queued'
   AND NOT EXISTS(SELECT 1 FROM vc_licenses l WHERE l.id=mail.activation_license_id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))`);
  await this.db.query(`UPDATE vc_email_outbox SET state='cancelled',text_body='' WHERE state='queued'
   AND id IN (SELECT 'activation-key:'||id::text FROM vc_activation_keys WHERE expires_at<=now())`);
  await this.db.query(`UPDATE vc_email_outbox mail SET state='cancelled',text_body='' WHERE mail.state='queued' AND NOT ${CURRENT_SUBSCRIPTION_NOTICE}`);
  await this.db.query(`UPDATE vc_email_outbox mail SET state='cancelled',text_body='' WHERE state='queued' AND id LIKE 'reset:%'
   AND NOT EXISTS(SELECT 1 FROM vc_password_resets reset WHERE reset.token_hash=substring(mail.id from 7) AND reset.expires_at>now())`);
  if(!this.configured)return {configured:false,sent:0,failed:0};let sent=0,failed=0;
  const attempted:string[]=[];
  for(let i=0;i<Math.min(limit,20);i++){
   const rows=await this.db.query(`UPDATE vc_email_outbox SET state='sending',locked_at=now(),attempts=attempts+1 WHERE id=(
    SELECT id FROM vc_email_outbox mail WHERE NOT (id=ANY($2::text[])) AND attempts<10 AND ($1::text IS NULL OR id=$1) AND ${CURRENT_SUBSCRIPTION_NOTICE} AND (activation_license_id IS NULL OR EXISTS(SELECT 1 FROM vc_licenses l WHERE l.id=mail.activation_license_id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))) AND (state='queued' OR (state='sending' AND locked_at<now()-interval '5 minutes'))
    ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`,[onlyId,attempted]);
   const mail=rows[0];if(!mail)break;attempted.push(mail.id);let providerFailure:string|null=null;let stopBatch=false;
   try{const response=await this.request("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+this.key,"Content-Type":"application/json","Idempotency-Key":mail.id},body:JSON.stringify({from:this.from,to:[mail.recipient],subject:mail.subject,text:mail.text_body,reply_to:process.env.EMAIL_REPLY_TO||undefined}),signal:AbortSignal.timeout(10000)});
    const result=await response.json().catch(()=>null);
    if(!response.ok){stopBatch=response.status===401||response.status===429||response.status>=500;providerFailure=emailRejection(response.status,result);throw new Error('delivery-rejected');}
    const providerId=typeof result?.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(result.id)?result.id:null;
    await this.db.query("UPDATE vc_email_outbox SET state='sent',sent_at=now(),text_body='',last_error=NULL,provider_message_id=$2 WHERE id=$1",[mail.id,providerId]);sent++;
    }catch{failed++;await this.db.query("UPDATE vc_email_outbox SET state='queued',last_error=$2 WHERE id=$1",[mail.id,providerFailure||'Delivery could not complete. Check network access to Resend and request logs, then retry.']);if(stopBatch||!providerFailure)break;}

  }
  return {configured:true,sent,failed};
 }
 async reminders(){return (await new SubscriptionLifecycle(this.db).run()).notificationsQueued;}
}
