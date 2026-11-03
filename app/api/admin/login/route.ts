import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE,createSessionToken,timingSafeEqual } from "../../../../lib/admin-auth";
import { api,service } from "../../../../lib/licensing-api";
import { readJson,sameOrigin,LicenseError } from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){
 let token="";
 const response=await api(async()=>{
  sameOrigin(request);if(!request.headers.get("origin"))throw new LicenseError(403,"A browser sign-in is required.");
  const secret=process.env.ADMIN_SESSION_SECRET,password=process.env.ADMIN_PASSWORD;
  if(!secret || secret.length<32 || !password || password.length<12)throw new LicenseError(503,"Administrator sign-in is not configured.");
  await service().rate("admin-login-global",20);
  const body=await readJson(request);
  if(typeof body.password!=="string" || body.password.length>256 || !timingSafeEqual(body.password,password))throw new LicenseError(401,"Incorrect password.");
  token=await createSessionToken(secret);return {message:"Signed in."};
 });
 if(token)response.cookies.set(ADMIN_SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:60*60*8});
 return response;
}
