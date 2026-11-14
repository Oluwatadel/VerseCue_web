import {getAndroidInstallerUrl} from '../../../../lib/site-config';
import {NextResponse} from 'next/server';
import {api,service,bearer} from '../../../../lib/licensing-api';
import {LicenseError} from '../../../../lib/licensing-security';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{const account=await service().account(bearer(request));if(!account.licenses.some(l=>l.status==='active'&&(!l.expires_at||new Date(l.expires_at).getTime()>Date.now())))throw new LicenseError(403,'Mobile control requires active paid or complimentary access.');
 const url=getAndroidInstallerUrl();if(!url)throw new LicenseError(503,'The Android installer download is not configured. Contact support.');
 const response=NextResponse.redirect(url);response.headers.set('Cache-Control','no-store');return response;
 }catch(error){return api(async()=>{throw error;});}
}
