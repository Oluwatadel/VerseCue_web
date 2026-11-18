import {api,bearer,service} from '../../../../lib/licensing-api';
import {readJson} from '../../../../lib/licensing-security';
import {licensingDb} from '../../../../lib/licensing-db';
import {recordInstallation} from '../../../../lib/installation-analytics';
export const dynamic='force-dynamic';
// Install counts are pseudonymous, client-reported estimates, never entitlement evidence.
export async function POST(request:Request){return api(async()=>{const input=await readJson(request,2048);if(typeof input.id!=='string'||!/^i1-[a-f0-9]{32}$/.test(input.id))throw new Error('Invalid installation');await service().rate('installation:'+input.id,40);let accountId=null;const token=bearer(request);if(token)accountId=(await service().account(token)).id;return recordInstallation(licensingDb(),input,accountId);});}
