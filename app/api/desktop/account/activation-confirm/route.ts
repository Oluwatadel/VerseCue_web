import {api,bearer} from '../../../../../lib/licensing-api';
import {activationDelivery} from '../../../../../lib/activation-api';
import {readJson} from '../../../../../lib/licensing-security';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{const body=await readJson(request);return activationDelivery().confirm(bearer(request),body.requestId,body.device);});}
