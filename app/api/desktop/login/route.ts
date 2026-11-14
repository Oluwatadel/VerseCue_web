import { api,service } from "../../../../lib/licensing-api";
import { readJson,sameOrigin,LicenseError } from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){ return api(async()=>{sameOrigin(request);const body=await readJson(request);if(body.activationCode)throw new LicenseError(410,"Activation keys are no longer used. Sign in through your browser and choose Check activation now.");return service().login(body);}); }
