import {NextResponse} from "next/server";
import {service,ACCOUNT_COOKIE} from "../../../../lib/licensing-api";
import {LicenseError} from "../../../../lib/licensing-security";
import {cookies} from "next/headers";
import {getWindowsInstallerUrl} from "../../../../lib/site-config";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const token=cookies().get(ACCOUNT_COOKIE)?.value;
 if(!token)return NextResponse.redirect(new URL("/account/login?next=/download",request.url));
 try {
  const account=await service().account(token);
  if(!account.organisation_name?.trim())return NextResponse.redirect(new URL("/account",request.url));
  const url=getWindowsInstallerUrl();
  if(!url)return NextResponse.json({error:"The Windows installer has not been published yet."},{status:503,headers:{"Cache-Control":"no-store"}});
  await service().recordDownload(token);
  const response=NextResponse.redirect(url);response.headers.set("Cache-Control","no-store");return response;
 }catch(error){
  if(error instanceof LicenseError && error.status===401)return NextResponse.redirect(new URL("/account/login?next=/download",request.url));
  return NextResponse.json({error:error instanceof LicenseError?error.message:"Downloads are temporarily unavailable. Please try again."},{status:error instanceof LicenseError?error.status:503,headers:{"Cache-Control":"no-store"}});
 }
}
