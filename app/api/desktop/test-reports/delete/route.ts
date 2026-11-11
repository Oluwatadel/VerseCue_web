import {api,bearer,service} from '../../../../../lib/licensing-api';
import {readJson} from '../../../../../lib/licensing-security';
import {licensingDb} from '../../../../../lib/licensing-db';
import {TestReports} from '../../../../../lib/test-reports';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{const input=await readJson(request),{account}=await service().activationDevice(bearer(request),input.device);return new TestReports(licensingDb()).remove(input.id,account.id);});}
