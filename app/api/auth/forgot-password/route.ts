import {api,service} from "../../../../lib/licensing-api";
import {readJson,sameOrigin,LicenseError,hash} from "../../../../lib/licensing-security";
import {licensingDb} from "../../../../lib/licensing-db";
import {EmailService} from "../../../../lib/email-service";
import {siteOrigin} from "../../../../lib/billing-plans";
export const runtime="nodejs";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const mail=new EmailService(licensingDb());if(!mail.configured)throw new LicenseError(503,"Password reset email is not configured yet. Contact support.");
 const result=await service().requestPasswordReset((await readJson(request)).email);
 const resetId=result?'reset:'+hash(result.token):null;
 if(result&&resetId)await mail.queue(resetId,result.account.id,result.account.email,'Reset your VerseCue password',`Use this link within one hour to reset your password: ${siteOrigin()}/account/reset-password?token=${encodeURIComponent(result.token)}. If you did not request this, ignore this email.`);
 if(resetId)try{await mail.dispatch(1,resetId);}catch{}
 return {message:'If that email has an account, a password reset email has been queued. Check your inbox.'};});}
