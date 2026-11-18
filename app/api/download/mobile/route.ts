import {startDownload} from '../../../../lib/download-access';
import {getAndroidInstallerUrl} from '../../../../lib/site-config';
import {NextResponse} from 'next/server';
import {api,service,bearer} from '../../../../lib/licensing-api';
import {LicenseError} from '../../../../lib/licensing-security';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{await service().account(bearer(request));
 const url=getAndroidInstallerUrl();if(!url)throw new LicenseError(503,'The Android installer download is not configured. Contact support.');
 if(new URL(request.url).searchParams.get('prepare')==='1')return NextResponse.json({url:startDownload('android').href},{headers:{'Cache-Control':'no-store'}});
 const response=NextResponse.redirect(startDownload('android'));response.headers.set('Cache-Control','no-store');return response;
 }catch(error){return api(async()=>{throw error;});}
}
