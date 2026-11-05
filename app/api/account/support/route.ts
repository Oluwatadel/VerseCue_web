import {api,service,bearer} from "../../../../lib/licensing-api";
import {readJson,sameOrigin,LicenseError} from "../../../../lib/licensing-security";
import {licensingDb} from "../../../../lib/licensing-db";
import {SupportService} from "../../../../lib/support-service";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{const token=bearer(request);if(!token)throw new LicenseError(401,"Please sign in.");const account=await service().account(token);const s=new SupportService(licensingDb());const id=new URL(request.url).searchParams.get('id');return id?s.detail(id,account.id):s.list(account.id);});}
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const token=bearer(request);if(!token)throw new LicenseError(401,"Please sign in.");const lic=service(),account=await lic.account(token);await lic.rate('support:'+account.id,20);const body=await readJson(request);const s=new SupportService(licensingDb());return body.action==='reply'?s.userReply(body.id,account as any,body.body):s.create(account as any,body);});}
