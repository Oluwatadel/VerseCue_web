import {api,admin} from '../../../../lib/licensing-api';
import {licensingDb} from '../../../../lib/licensing-db';
import {AuditService} from '../../../../lib/audit-service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){return api(async()=>{await admin(request);return new AuditService(licensingDb()).list(new URL(request.url).searchParams);});}

export async function POST(request:Request){return api(async()=>{await admin(request);return new AuditService(licensingDb()).cleanup();});}
