import type {LicensingDb} from "./licensing-db";
import {siteOrigin} from "./billing-plans";
export class EmailService {
 constructor(private db:LicensingDb,private key=process.env.RESEND_API_KEY||"",private from=process.env.EMAIL_FROM||"",private request:typeof fetch=fetch){}
 get configured(){return !!this.key&&/^[^\r\n]+@[^\r\n]+$/.test(this.from);}
 async queue(id:string,accountId:string|null,email:string,subject:string,text:string){await this.db.query("INSERT INTO vc_email_outbox(id,account_id,recipient,subject,text_body) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING",[id,accountId,email,subject,text]);}
 async welcome(account:{id:string;email:string;organisation_name:string}){return this.queue("welcome:"+account.id,account.id,account.email,"Welcome to VerseCue",`Welcome, ${account.organisation_name}. Your free account is ready. Download VerseCue at ${siteOrigin()}/download. AI assistance is optional and can be activated later.`);}
 async dispatch(limit=5,onlyId:string|null=null){
  await this.db.query(`UPDATE vc_email_outbox mail SET state='cancelled',text_body='' WHERE activation_license_id IS NOT NULL AND state='queued'
   AND NOT EXISTS(SELECT 1 FROM vc_licenses l WHERE l.id=mail.activation_license_id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))`);
  if(!this.configured)return {configured:false,sent:0};let sent=0;
  for(let i=0;i<Math.min(limit,20);i++){
   const rows=await this.db.query(`UPDATE vc_email_outbox SET state='sending',locked_at=now(),attempts=attempts+1 WHERE id=(
    SELECT id FROM vc_email_outbox mail WHERE attempts<10 AND ($1::text IS NULL OR id=$1) AND (activation_license_id IS NULL OR EXISTS(SELECT 1 FROM vc_licenses l WHERE l.id=mail.activation_license_id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))) AND (state='queued' OR (state='sending' AND locked_at<now()-interval '5 minutes'))
    ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`,[onlyId]);
   const mail=rows[0];if(!mail)break;
   try{const response=await this.request("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+this.key,"Content-Type":"application/json","Idempotency-Key":mail.id},body:JSON.stringify({from:this.from,to:[mail.recipient],subject:mail.subject,text:mail.text_body,reply_to:process.env.EMAIL_REPLY_TO||undefined}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error("delivery-rejected");
    await this.db.query("UPDATE vc_email_outbox SET state='sent',sent_at=now(),text_body='',last_error=NULL WHERE id=$1",[mail.id]);sent++;
   }catch{await this.db.query("UPDATE vc_email_outbox SET state='queued',last_error='Delivery failed; check provider configuration and quota.' WHERE id=$1",[mail.id]);break;}
  }
  return {configured:true,sent};
 }
 async reminders(){
  const rows=await this.db.query(`SELECT a.id,a.email,l.id AS license_id,l.expires_at FROM vc_accounts a JOIN vc_licenses l ON l.account_id=a.id
   WHERE a.status='active' AND l.status='active' AND l.expires_at>now() AND l.expires_at<now()+interval '7 days'
   UNION ALL SELECT a.id,a.email,o.id AS license_id,o.paid_expires_at AS expires_at FROM vc_organisations o JOIN vc_accounts a ON a.id=o.owner_account_id
   WHERE a.status='active' AND o.status='active' AND NOT o.unlimited_ai AND o.paid_expires_at>now() AND o.paid_expires_at<now()+interval '7 days'`);
  for(const row of rows)await this.queue("expiry:"+row.license_id+":"+new Date(row.expires_at).toISOString(),row.id,row.email,"Your VerseCue AI access is approaching renewal",`Your AI access expires on ${new Date(row.expires_at).toISOString()}. Check your plan and auto-renew settings at ${siteOrigin()}/account/upgrade. Free Bible and media tools remain available.`);
  return rows.length;
 }
}
