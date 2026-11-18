import {NextResponse} from 'next/server';
import {service,bearer,api} from '../../../../lib/licensing-api';
import {grantDownload} from '../../../../lib/download-access';
import {LicenseError} from '../../../../lib/licensing-security';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const url=new URL(request.url),kind=url.searchParams.get('kind');if(kind!=='windows'&&kind!=='android')throw new LicenseError(400,'Invalid download platform.');
 const token=bearer(request);if(!token)return NextResponse.redirect(new URL('/account/login?next='+encodeURIComponent(url.pathname+url.search),request.url));
 const account=await service().account(token);if(account.session_kind!=='web')throw new LicenseError(401,'Sign in on the website to download.');
 const nonce=url.searchParams.get('nonce')||'';const redirect=grantDownload(account.id,kind,nonce);
 await service().recordDownload(token,kind,nonce);
 return NextResponse.redirect(redirect,{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch(error){return api(async()=>{throw error;});}}
