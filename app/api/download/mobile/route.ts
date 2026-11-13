import {NextResponse} from 'next/server';
import {api,service,bearer} from '../../../../lib/licensing-api';
import {LicenseError} from '../../../../lib/licensing-security';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{const account=await service().account(bearer(request));if(!account.licenses.some(l=>l.status==='active'&&(!l.expires_at||new Date(l.expires_at).getTime()>Date.now())))throw new LicenseError(403,'Mobile control requires active paid or complimentary access.');
 const value=process.env.MOBILE_ANDROID_DOWNLOAD_URL;if(!value)throw new LicenseError(503,'The Android installer has not been published yet.');const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw new LicenseError(503,'The mobile download is not configured.');
 const response=NextResponse.redirect(url);response.headers.set('Cache-Control','no-store');return response;
 }catch(error){return api(async()=>{throw error;});}
}
