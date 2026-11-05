import {api,bearer} from "../../../../lib/licensing-api";
import {billing} from "../../../../lib/billing-api";
import {readJson,sameOrigin} from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const body=await readJson(request);return billing().confirm(body.reference,bearer(request));});}
