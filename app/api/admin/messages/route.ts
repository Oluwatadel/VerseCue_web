import {api,admin} from "../../../../lib/licensing-api";
import {licensingDb} from "../../../../lib/licensing-db";
import {EmailService} from "../../../../lib/email-service";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);const db=licensingDb();return {configured:new EmailService(db).configured,messages:await db.query("SELECT id,recipient,subject,state,attempts,last_error,created_at,sent_at FROM vc_email_outbox ORDER BY created_at DESC LIMIT 100")};});}
export async function POST(request:Request){return api(async()=>{await admin(request);const db=licensingDb();await db.query("UPDATE vc_email_outbox SET attempts=0 WHERE state='queued' AND attempts>=10");return new EmailService(db).dispatch(20);});}
