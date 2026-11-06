import {api,admin} from "../../../../lib/licensing-api";
import {licensingDb} from "../../../../lib/licensing-db";
import {readJson,LicenseError} from '../../../../lib/licensing-security';
import {EmailService} from "../../../../lib/email-service";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);const db=licensingDb();return {configured:new EmailService(db).configured,configuration:{apiKeyPresent:!!process.env.RESEND_API_KEY?.trim(),senderPresent:!!process.env.EMAIL_FROM?.trim(),siteUrlPresent:!!process.env.NEXT_PUBLIC_SITE_URL?.trim()},messages:await db.query("SELECT id,recipient,subject,state,attempts,last_error,created_at,sent_at,subscription_notice,subscription_expires_at,provider_message_id FROM vc_email_outbox ORDER BY created_at DESC LIMIT 100")};});}
export async function POST(request:Request){return api(async()=>{await admin(request);const body=request.body?await readJson(request):{},id=body.id??null;
 if(id!==null&&(typeof id!=='string'||!/^[a-zA-Z0-9:._-]{1,250}$/.test(id)))throw new LicenseError(400,'Choose a valid queued email.');
 const db=licensingDb();await db.query("UPDATE vc_email_outbox SET attempts=0 WHERE state='queued' AND attempts>=10 AND ($1::text IS NULL OR id=$1)",[id]);return new EmailService(db).dispatch(id?1:20,id);});}
