import {api,service,admin} from "../../../../lib/licensing-api";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);return service().analytics();});}
