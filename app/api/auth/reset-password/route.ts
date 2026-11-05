import {api,service} from "../../../../lib/licensing-api";
import {readJson,sameOrigin} from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const body=await readJson(request);return service().resetPassword(body.token,body.password);});}
