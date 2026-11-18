import {supportNotificationEmail} from "./support-notifications";
import {randomUUID} from "node:crypto";
import type {LicensingDb} from "./licensing-db";
import {LicenseError} from "./licensing-security";
import {EmailService} from "./email-service";
import {siteOrigin} from "./billing-plans";
export class SupportService {
 constructor(private db:LicensingDb,private mail=new EmailService(db)){}
 private async deliver(id:string){if(this.mail.configured)try{await this.mail.dispatch(1,id);}catch{/* Saved tickets and queued emails remain available for retry. */}}
 private async notifyAdmin(event:string,id:string,subject:string,body:string){const recipient=supportNotificationEmail();if(!recipient)return;const mailId='support-admin:'+event;await this.mail.queue(mailId,null,recipient,'verseVIO support: '+subject,body+'\n\nTicket: '+id+'\nOpen '+siteOrigin()+'/admin/support?ticket='+encodeURIComponent(id)+'\nRespond from the support dashboard. Replies to this notification are not yet imported automatically.');await this.deliver(mailId);}
 private id(value:unknown){const id=String(value||'');if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new LicenseError(400,'Invalid request.');return id;}
 private text(value:unknown,max=5000){const text=String(value||'').trim();if(!text||text.length>max||text.includes('\u0000'))throw new LicenseError(400,'Enter a message within '+max+' characters.');return text;}
 async list(accountId?:string,filters:Record<string,string>={}){
  const values:any[]=[],where:string[]=[];const add=(value:any)=>{values.push(value);return '$'+values.length;};
  if(accountId)where.push('r.account_id='+add(accountId));
  if(filters.status&&filters.status!=='all'){if(!['open','in-progress','awaiting-user','resolved'].includes(filters.status))throw new LicenseError(400,'Invalid status.');where.push('r.status='+add(filters.status));}
  if(filters.category&&filters.category!=='all')where.push('r.category='+add(filters.category));
  if(filters.priority&&filters.priority!=='all')where.push('r.priority='+add(filters.priority));
  if(filters.q){const query=filters.q.trim().slice(0,160),param=add('%'+query+'%');where.push(`(r.subject ILIKE ${param} OR r.id::text ILIKE ${param} OR a.email ILIKE ${param} OR a.organisation_name ILIKE ${param} OR r.assigned_to ILIKE ${param})`);}
  for(const key of ['from','to'])if(filters[key]){if(!/^\d{4}-\d{2}-\d{2}$/.test(filters[key])||!Number.isFinite(Date.parse(filters[key])))throw new LicenseError(400,'Choose a valid date.');where.push('r.created_at '+(key==='from'?'>= ':'< ')+add(filters[key])+'::date'+(key==='to'?" + interval '1 day'":''));}
  const clause=where.length?'WHERE '+where.join(' AND '):'';const [{total}]=await this.db.query(`SELECT count(*)::int AS total FROM vc_support_requests r JOIN vc_accounts a ON a.id=r.account_id ${clause}`,values);
  const page=Math.max(1,Math.min(10000,Number.parseInt(filters.page||'1',10)||1));
  const requests=await this.db.query(`SELECT r.*,a.email,a.organisation_name FROM vc_support_requests r JOIN vc_accounts a ON a.id=r.account_id ${clause} ORDER BY r.updated_at DESC,r.id LIMIT 25 OFFSET ${add((page-1)*25)}`,values);
  const summary=await this.db.query(`SELECT status,count(*)::int AS count FROM vc_support_requests ${accountId?'WHERE account_id=$1':''} GROUP BY status`,accountId?[accountId]:[]);
  return {requests,total,page,pageSize:25,summary};
 }
 async detail(value:unknown,accountId?:string){const id=this.id(value);const[request]=await this.db.query(`SELECT r.*,a.email,a.organisation_name FROM vc_support_requests r JOIN vc_accounts a ON a.id=r.account_id WHERE r.id=$1 ${accountId?'AND r.account_id=$2':''}`,[id,...accountId?[accountId]:[]]);if(!request)throw new LicenseError(404,'Support request not found.');const messages=await this.db.query(`SELECT id,role,body,created_at FROM vc_support_messages WHERE request_id=$1 ${accountId?"AND role<>'internal'":''} ORDER BY created_at,id`,[id]);return {request,messages};}
 async create(account:{id:string;email:string},input:Record<string,any>){
  if(!['general','activation','billing','device-reset','organisation','bug'].includes(input.category))throw new LicenseError(400,'Choose a request category.');
  const id=randomUUID(),subject=this.text(input.subject,160),description=this.text(input.description);
  const optional=(value:unknown,max:number)=>value?this.text(value,max):'';const version=optional(input.appVersion,80),platform=optional(input.platform,120),steps=optional(input.steps,3000);
  if(/[\r\n]/.test(subject))throw new LicenseError(400,'Use one line for the subject.');
  const conversation=input.conversation?this.text(input.conversation,6000):'';
  const externalKey=input.clientRequestId?'support-chat:'+account.id+':'+this.id(input.clientRequestId):null;
  await this.db.transaction([{text:'INSERT INTO vc_support_requests(id,account_id,category,subject,description,app_version,platform,steps_to_reproduce,external_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(external_key) DO NOTHING',values:[id,account.id,input.category,subject,description,version,platform,steps,externalKey]},
   ...conversation?[{text:"INSERT INTO vc_support_messages(id,request_id,role,body) SELECT $1,$2,'user',$3 WHERE EXISTS(SELECT 1 FROM vc_support_requests WHERE id=$2)",values:[randomUUID(),id,'Customer-shared automated chat conversation (not a verified support-team reply):\n\n'+conversation]}]:[]]);
  const saved=externalKey?(await this.db.query('SELECT id,subject FROM vc_support_requests WHERE external_key=$1 AND account_id=$2',[externalKey,account.id]))[0]:{id,subject};
  await this.mail.queue('support-created:'+saved.id,account.id,account.email,'verseVIO support request received',`We received your request: ${saved.subject}. Track it and reply at ${siteOrigin()}/account/support. Reference: ${saved.id}.`);
  await this.notifyAdmin('created:'+saved.id,saved.id,saved.subject,'A customer submitted a complaint.\nCustomer: '+account.email+'\n'+description);
  await this.deliver('support-created:'+saved.id);
  return {id:saved.id,message:'Support request submitted.'};
 }
 async userReply(value:unknown,account:{id:string;email:string},body:unknown){const id=this.id(value);const {request}=await this.detail(id,account.id);const messageId=randomUUID(),text=this.text(body);await this.db.transaction([{text:"INSERT INTO vc_support_messages(id,request_id,role,body) VALUES($1,$2,'user',$3)",values:[messageId,id,text]},{text:"UPDATE vc_support_requests SET status='open',resolved_at=NULL,customer_rating=NULL,customer_feedback='',updated_at=now() WHERE id=$1",values:[id]}]);await this.notifyAdmin('reply:'+messageId,id,request.subject,'A customer replied.\nCustomer: '+account.email+'\n'+text);return {message:'Reply added.'};}
 async update(value:unknown,input:Record<string,any>){
  const id=this.id(value);const{request}=await this.detail(id);
  const status=String(input.status||request.status),priority=String(input.priority||request.priority),assignedTo=String(input.assignedTo??request.assigned_to).trim();
  if(!['open','in-progress','awaiting-user','resolved'].includes(status)||!['normal','high'].includes(priority)||assignedTo.length>100||/[\r\n]/.test(assignedTo))throw new LicenseError(400,'Invalid support settings.');
  const resolution=input.resolutionSummary===undefined?String(request.resolution_summary||''):String(input.resolutionSummary).trim();if(resolution.length>3000)throw new LicenseError(400,'Resolution summary is too long.');if(status==='resolved'&&!resolution&&!input.reply)throw new LicenseError(400,'Add a resolution summary or public reply before resolving.');
  const reply=input.reply?this.text(input.reply):'',note=input.internalNote?this.text(input.internalNote):'';const event=randomUUID();
  await this.db.transaction([{text:"UPDATE vc_support_requests SET status=$2,priority=$3,assigned_to=$4,resolution_summary=$5,resolved_at=CASE WHEN $2='resolved' THEN COALESCE(resolved_at,now()) ELSE NULL END,updated_at=now() WHERE id=$1",values:[id,status,priority,assignedTo,status==='resolved'?resolution||reply:resolution]},
   ...reply?[{text:"INSERT INTO vc_support_messages(id,request_id,role,body) VALUES($1,$2,'admin',$3)",values:[event,id,reply]}]:[],
   ...note?[{text:"INSERT INTO vc_support_messages(id,request_id,role,body) VALUES($1,$2,'internal',$3)",values:[randomUUID(),id,note]}]:[],
   {text:'INSERT INTO vc_license_audit(id,action,subject) VALUES($1,$2,$3)',values:[randomUUID(),'support:update',id]}]);
  if(reply||status!==request.status)await this.mail.queue('support-update:'+event,request.account_id,request.email,'Update on your verseVIO support request',`${request.subject}\nStatus: ${status}\n${reply}\n${status==='resolved'?'Resolution: '+(resolution||reply):''}\nReply at ${siteOrigin()}/account/support.`);
  if(reply||status!==request.status)await this.deliver('support-update:'+event);
  return {message:'Support request updated. User-facing updates are queued for email; internal notes stay private.'};
 }
 async feedback(value:unknown,accountId:string,input:Record<string,any>){const id=this.id(value);const {request}=await this.detail(id,accountId);if(request.status!=='resolved')throw new LicenseError(409,'Feedback is available after resolution. Reply to reopen an unresolved issue.');const rating=Number(input.rating);if(!Number.isInteger(rating)||rating<1||rating>5)throw new LicenseError(400,'Choose a rating from 1 to 5.');const feedback=input.feedback?this.text(input.feedback,1000):'';await this.db.query('UPDATE vc_support_requests SET customer_rating=$2,customer_feedback=$3 WHERE id=$1 AND account_id=$4',[id,rating,feedback,accountId]);return {message:'Thank you. Your resolution feedback has been saved.'};}

}
