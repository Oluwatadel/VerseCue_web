import { api,service,bearer,ACCOUNT_COOKIE } from "../../../../lib/licensing-api";
import { sameOrigin } from "../../../../lib/licensing-security";
export const runtime="nodejs";
export async function POST(request:Request){const response=await api(async()=>{sameOrigin(request);await service().logout(bearer(request));return {message:"Signed out."};});response.cookies.delete(ACCOUNT_COOKIE);return response;}
