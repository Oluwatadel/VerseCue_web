import { api,service,bearer } from "../../../lib/licensing-api";
import {LicenseError} from "../../../lib/licensing-security";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{const token=bearer(request);if(!token)throw new LicenseError(401,"Please sign in.");const account=await service().account(token);return {account:{email:account.email,organisationName:account.organisation_name,status:account.status,deviceName:account.device_name,deviceId:account.device_id,licenses:account.licenses}};});}
