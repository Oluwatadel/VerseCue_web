import {licensingDb} from '../../../lib/licensing-db';
import { api,service,bearer } from "../../../lib/licensing-api";
import {LicenseError} from "../../../lib/licensing-security";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{const token=bearer(request);if(!token)throw new LicenseError(401,"Please sign in.");const account=await service().account(token);const [downloads]=await licensingDb().query('SELECT count(*)::int AS count,min(created_at) AS first,max(created_at) AS last FROM vc_downloads WHERE account_id=$1',[account.id]);return {account:{registeredAt:account.created_at,downloads,email:account.email,organisationName:account.organisation_name,churchLocation:account.church_location,status:account.status,deviceName:account.device_name,deviceId:account.device_id,licenses:account.licenses}};});}
