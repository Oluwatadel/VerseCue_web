import {api,service,bearer} from "../../../../lib/licensing-api";
import {readJson,sameOrigin} from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);return service().updateProfile(bearer(request),(await readJson(request)).organisationName);});}
