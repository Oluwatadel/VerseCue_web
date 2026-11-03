import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "./admin-auth";
import { licensingDb } from "./licensing-db";
import { LicensingService, issuerConfig } from "./licensing-service";
import { LicenseError, sameOrigin } from "./licensing-security";
export const ACCOUNT_COOKIE="vc_account_session";
export const service=()=>new LicensingService(licensingDb(),issuerConfig());
export async function admin(request: Request) {
 const secret=process.env.ADMIN_SESSION_SECRET;
 if(!secret || secret.length<32 || !await verifySessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value,secret)) throw new LicenseError(401,"Administrator sign-in required.");
 if(request.method!=="GET") { sameOrigin(request); if(!request.headers.get("origin")) throw new LicenseError(403,"An administrator browser session is required."); }
}
export function bearer(request: Request) { return request.headers.get("authorization")?.replace(/^Bearer /i,"") || cookies().get(ACCOUNT_COOKIE)?.value || ""; }
export async function api(work:()=>Promise<unknown>) {
 try { return NextResponse.json(await work(),{headers:{"Cache-Control":"no-store"}}); }
 catch(error) {
  const status=error instanceof LicenseError?error.status:503;
  const message=error instanceof LicenseError?error.message:"The account/activation service is unavailable. Contact your administrator.";
  return NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
 }
}
