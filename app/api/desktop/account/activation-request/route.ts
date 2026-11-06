import {api,bearer} from '../../../../../lib/licensing-api';
import {activationDelivery} from '../../../../../lib/activation-api';
import {readJson} from '../../../../../lib/licensing-security';
export const runtime='nodejs';
export async function POST(request:Request){return api(()=>activationDelivery().pending(bearer(request)));}
