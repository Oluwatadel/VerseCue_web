import { api,service,bearer } from "../../../lib/licensing-api";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{const account=await service().account(bearer(request));return {account:{email:account.email,status:account.status,deviceName:account.device_name,deviceId:account.device_id,licenses:account.licenses}};});}
