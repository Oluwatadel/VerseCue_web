import {api,admin} from '../../../../lib/licensing-api';
import {readJson,LicenseError} from '../../../../lib/licensing-security';
import {licensingDb} from '../../../../lib/licensing-db';
import {TestReports} from '../../../../lib/test-reports';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){return api(async()=>{await admin(request);const id=new URL(request.url).searchParams.get('id'),reports=new TestReports(licensingDb());return id?reports.detail(id):reports.list();});}
export async function POST(request:Request){return api(async()=>{await admin(request);const input=await readJson(request),reports=new TestReports(licensingDb());if(input.action==='training-export')return reports.trainingExport(input.id);if(input.action==='audio')return reports.audio(input.id);if(input.action==='delete')return reports.remove(input.id);if(input.action==='review')return reports.review(input.id,input.state);throw new LicenseError(400,'Unknown test report action.');});}
