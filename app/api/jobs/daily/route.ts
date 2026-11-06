import {api} from "../../../../lib/licensing-api";
import {LicenseError} from "../../../../lib/licensing-security";
import {timingSafeEqual} from "node:crypto";
import {SubscriptionLifecycle} from '../../../../lib/subscription-lifecycle';
import {EmailService} from "../../../../lib/email-service";
import {licensingDb} from "../../../../lib/licensing-db";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{const secret=process.env.CRON_SECRET||'';const provided=request.headers.get('authorization')||'';const expected='Bearer '+secret;
 if(secret.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))throw new LicenseError(401,'Job authentication required.');
 const db=licensingDb(),mail=new EmailService(db);const lifecycle=await new SubscriptionLifecycle(db).run();return {...lifecycle,...await mail.dispatch(20)};});}
