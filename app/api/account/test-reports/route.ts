import {api,bearer,service} from '../../../../lib/licensing-api';
import {readJson,sameOrigin,LicenseError} from '../../../../lib/licensing-security';
import {licensingDb} from '../../../../lib/licensing-db';
import {TestReports} from '../../../../lib/test-reports';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function owner(request:Request){const account=await service().account(bearer(request));if(account.session_kind!=='web')throw new LicenseError(401,'Sign in on the website to manage reports.');return account;}
export async function GET(request:Request){return api(async()=>{const account=await owner(request),id=new URL(request.url).searchParams.get('id'),reports=new TestReports(licensingDb());return id?reports.detail(id,account.id):reports.list(account.id);});}
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const account=await owner(request),input=await readJson(request),reports=new TestReports(licensingDb());if(input.action==='delete')return reports.remove(input.id,account.id);if(input.action==='audio')return reports.audio(input.id,account.id);throw new LicenseError(400,'Unknown test report action.');});}
