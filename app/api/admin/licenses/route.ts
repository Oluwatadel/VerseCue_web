import { api,service,admin } from "../../../../lib/licensing-api";
import { readJson } from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);return service().adminList();});}
export async function POST(request:Request){return api(async()=>{await admin(request);const body=await readJson(request);return body.action==="grant-free"?service().grantFree(body.email,body.expiresAt):body.action==="issue"?service().issue(body.email,body.expiresAt):service().adminAction(String(body.action),String(body.id));});}
