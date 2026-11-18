import {randomBytes} from 'node:crypto';
import {api,bearer,service} from '../../../../lib/licensing-api';
import {grantDownload,downloadGateway} from '../../../../lib/download-access';
import {LicenseError} from '../../../../lib/licensing-security';
export const dynamic='force-dynamic';
export async function POST(request:Request){return api(async()=>{const account=await service().account(bearer(request));if(account.session_kind!=='free')throw new LicenseError(401,'A signed-in desktop session is required.');const grant=grantDownload(account.id,'windows',randomBytes(32).toString('hex'));return {url:new URL('/update/verseVIO-Setup.exe',downloadGateway()).href,ticket:grant.searchParams.get('ticket')};});}
