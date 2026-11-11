import {api,bearer,service} from '../../../../lib/licensing-api';
import {readJson} from '../../../../lib/licensing-security';
import {licensingDb} from '../../../../lib/licensing-db';
import {TestReports} from '../../../../lib/test-reports';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{const input=await readJson(request,550000),s=service(),{account}=await s.activationDevice(bearer(request),input.device);await s.rate('test-report:'+account.id,20);return new TestReports(licensingDb()).prepare(account.id,input.clientId,input.report);});}
