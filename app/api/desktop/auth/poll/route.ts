import {api,service} from '../../../../../lib/licensing-api';
import {licensingDb} from '../../../../../lib/licensing-db';
import {readJson} from '../../../../../lib/licensing-security';
import {BrowserDesktopAuth} from '../../../../../lib/browser-desktop-auth';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{const input=await readJson(request);return new BrowserDesktopAuth(licensingDb(),service()).poll(input.code,input.device);});}
