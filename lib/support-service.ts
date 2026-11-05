import {randomUUID} from "node:crypto";
import type {LicensingDb} from "./licensing-db";
import {LicenseError} from "./licensing-security";
import {EmailService} from "./email-service";
import {siteOrigin} from "./billing-plans";
export class SupportService {
 constructor(private db:LicensingDb,private mail=new EmailService(db)){}
 private id(value:unknown){const id=String(value||'');if(!/^[a-f0-9-]{36}$/i.test(id))throw new LicenseError(400,'Invalid request.');return id;}
 private text(value:unknown,max=5000){const text=String(value||'').trim();if(!text||text.length>max||text.includes('\u0000'))throw new LicenseError(400,'Enter a message within '+max+' characters.');return text;}
 async list(accountId?:string){return {requests:await this.db.query(`SELECT r.*,a.email,a.organisation_name FROM vc_support_requests r JOIN vc_accounts a ON a.id=r.account_id ${accountId?'WHERE r.account_id=$1':''} ORDER BY r.updated_at DESC LIMIT 200`,accountId?[accountId]:[])};}
 async detail(value:unknown,accountId?:string){const id=this.id(value);const[request]=await this.db.query(`SELECT r.*,a.email,a.organisation_name FROM vc_support_requests r JOIN vc_accounts a ON a.id=r.account_id WHERE r.id=$1 ${accountId?'AND r.account_id=$2':''}`,[id,...accountId?[accountId]:[]]);if(!request)throw new LicenseError(404,'Support request not found.');const messages=await this.db.query(`SELECT id,role,body,created_at FROM vc_support_messages WHERE request_id=$1 ${accountId?"AND role<>'internal'":''} ORDER BY created_at,id`,[id]);return {request,messages};}
 async create(account:{id:string;email:string},input:Record<string,any>){
  if(!['general','activation','billing','device-reset','organisation','bug'].includes(input.category))throw new LicenseError(400,'Choose a request category.');
  const id=randomUUID(),subject=this.text(input.subject,160),description=this.text(input.description);
  if(/[\r\n]/.test(subject))throw new LicenseError(400,'Use one line for the subject.');
  await this.db.query('INSERT INTO vc_support_requests(id,account_id,category,subject,description) VALUES($1,$2,$3,$4,$5)',[id,account.id,input.category,subject,description]);
  await this.mail.queue('support-created:'+id,account.id,account.email,'VerseCue support request received',`We received your request: ${subject}. Track it and reply at ${siteOrigin()}/account/support. Reference: ${id}.`);
  return {id,message:'Support request submitted.'};
 }
 async userReply(value:unknown,account:{id:string;email:string},body:unknown){const id=this.id(value);await this.detail(id,account.id);await this.db.transaction([{text:"INSERT INTO vc_support_messages(id,request_id,role,body) VALUES($1,$2,'user',$3)",values:[randomUUID(),id,this.text(body)]},{text:"UPDATE vc_support_requests SET status='open',updated_at=now() WHERE id=$1",values:[id]}]);return {message:'Reply added.'};}
 async update(value:unknown,input:Record<string,any>){
  const id=this.id(value);const{request}=await this.detail(id);
  const status=String(input.status||request.status),priority=String(input.priority||request.priority),assignedTo=String(input.assignedTo??request.assigned_to).trim();
  if(!['open','in-progress','awaiting-user','resolved'].includes(status)||!['normal','high'].includes(priority)||assignedTo.length>100||/[\r\n]/.test(assignedTo))throw new LicenseError(400,'Invalid support settings.');
  const reply=input.reply?this.text(input.reply):'',note=input.internalNote?this.text(input.internalNote):'';const event=randomUUID();
  await this.db.transaction([{text:'UPDATE vc_support_requests SET status=$2,priority=$3,assigned_to=$4,updated_at=now() WHERE id=$1',values:[id,status,priority,assignedTo]},
   ...reply?[{text:"INSERT INTO vc_support_messages(id,request_id,role,body) VALUES($1,$2,'admin',$3)",values:[event,id,reply]}]:[],
   ...note?[{text:"INSERT INTO vc_support_messages(id,request_id,role,body) VALUES($1,$2,'internal',$3)",values:[randomUUID(),id,note]}]:[],
   {text:'INSERT INTO vc_license_audit(id,action,subject) VALUES($1,$2,$3)',values:[randomUUID(),'support:update',id]}]);
  if(reply||status!==request.status)await this.mail.queue('support-update:'+event,request.account_id,request.email,'Update on your VerseCue support request',`${request.subject}\nStatus: ${status}\n${reply}\nReply at ${siteOrigin()}/account/support.`);
  return {message:'Support request updated. User-facing updates are queued for email; internal notes stay private.'};
 }
}
