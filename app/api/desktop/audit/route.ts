import {api,bearer,service} from '../../../../lib/licensing-api';
import {readJson,LicenseError} from '../../../../lib/licensing-security';
import {licensingDb} from '../../../../lib/licensing-db';
import {AuditService} from '../../../../lib/audit-service';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{const token=bearer(request);if(!token)throw new LicenseError(401,"Desktop sign-in required.");const body=await readJson(request),licensing=service();const {account}=await licensing.activationDevice(token,body.device);await licensing.rate('desktop-audit:'+account.id,60);return new AuditService(licensingDb()).recordDesktop(account,body.id,body.action);});}
