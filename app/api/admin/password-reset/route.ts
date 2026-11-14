import {api,admin,service} from '../../../../lib/licensing-api';
import {readJson,LicenseError} from '../../../../lib/licensing-security';
import {siteOrigin} from '../../../../lib/billing-plans';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{await admin(request);const body=await readJson(request);const result=await service().requestPasswordReset(body.email);if(!result)throw new LicenseError(404,'No active account was found for that email.');return {resetUrl:siteOrigin()+'/account/reset-password?token='+encodeURIComponent(result.token),message:'Private reset link created. It expires in one hour and can be used once. Share only after verifying the account owner.'};});}
