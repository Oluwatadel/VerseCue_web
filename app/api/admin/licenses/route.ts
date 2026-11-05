import {api,service,admin} from "../../../../lib/licensing-api";
import {readJson} from "../../../../lib/licensing-security";
import {EmailService} from "../../../../lib/email-service";
import {licensingDb} from "../../../../lib/licensing-db";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);return service().adminList();});}
export async function POST(request:Request){return api(async()=>{await admin(request);const body=await readJson(request);
 if(body.action==='grant-free'||body.action==='issue'){
  const result=body.action==='grant-free'?await service().grantFree(body.email,body.expiresAt):await service().issue(body.email,body.expiresAt);
  const db=licensingDb();try{await new EmailService(db).dispatch(1,'activation:'+result.id);}catch{}
  const [mail]=await db.query('SELECT state FROM vc_email_outbox WHERE id=$1',['activation:'+result.id]);
  return {...result,emailState:mail?.state||'queued',message:result.message+(mail?.state==='sent'?' Activation email sent.':' Activation email queued; see Email delivery.')};
 }
 return service().adminAction(String(body.action),String(body.id));});}
