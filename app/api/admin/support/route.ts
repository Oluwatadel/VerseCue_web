import {api,admin} from "../../../../lib/licensing-api";
import {readJson,LicenseError} from "../../../../lib/licensing-security";
import {licensingDb} from "../../../../lib/licensing-db";
import {SupportService} from "../../../../lib/support-service";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);const id=new URL(request.url).searchParams.get('id');const s=new SupportService(licensingDb());return id?s.detail(id):s.list();});}
export async function POST(request:Request){return api(async()=>{await admin(request);const body=await readJson(request);return new SupportService(licensingDb()).update(body.id,body);});}
