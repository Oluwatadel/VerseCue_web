import { NextResponse } from "next/server";
import { api,service,ACCOUNT_COOKIE } from "../../../../lib/licensing-api";
import { readJson,sameOrigin } from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){ let session=""; const response=await api(async()=>{sameOrigin(request);const body=await readJson(request);const result=await service().webLogin(body.email,body.password);session=result.session;return {account:result.account};});
 if(session) response.cookies.set(ACCOUNT_COOKIE,session,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:60*60*24*30}); return response; }
