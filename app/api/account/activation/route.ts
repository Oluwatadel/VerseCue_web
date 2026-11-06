import {api,bearer} from '../../../../lib/licensing-api';
import {activationDelivery} from '../../../../lib/activation-api';
import {sameOrigin,readJson,LicenseError} from '../../../../lib/licensing-security';
export const runtime='nodejs';
export async function GET(request:Request){return api(()=>activationDelivery().state(bearer(request),new URL(request.url).searchParams.get('request')||undefined));}
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const body=await readJson(request),delivery=activationDelivery();if(body.action==='connect')return delivery.connect(bearer(request),body.deviceId);if(body.action==='email-key')return delivery.emailKey(bearer(request));throw new LicenseError(400,'Choose desktop activation or an emailed key.');});}
