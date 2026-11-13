import {api,service,bearer} from '../../../../lib/licensing-api';
import {licensingDb} from '../../../../lib/licensing-db';
import {readJson,sameOrigin,LicenseError} from '../../../../lib/licensing-security';
import {BrowserDesktopAuth} from '../../../../lib/browser-desktop-auth';
export const runtime='nodejs';
export async function GET(request:Request){return api(async()=>{await service().account(bearer(request));return new BrowserDesktopAuth(licensingDb(),service()).info(new URL(request.url).searchParams.get('code'));});}
export async function POST(request:Request){return api(async()=>{sameOrigin(request);if(!request.headers.get('origin'))throw new LicenseError(403,'Browser approval is required.');const input=await readJson(request);return new BrowserDesktopAuth(licensingDb(),service()).approve(bearer(request),input.code);});}
