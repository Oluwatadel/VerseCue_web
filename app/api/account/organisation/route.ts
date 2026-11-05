import {api,service,bearer} from "../../../../lib/licensing-api";import {readJson,sameOrigin,LicenseError} from "../../../../lib/licensing-security";import {licensingDb} from "../../../../lib/licensing-db";import {OrganisationService} from "../../../../lib/organisation-service";
export const runtime="nodejs";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const token=bearer(request);if(!token)throw new LicenseError(401,"Please sign in.");const lic=service(),account=await lic.account(token);await lic.rate('org-invite:'+account.id,10);return new OrganisationService(licensingDb()).claim(account.id,account.email,(await readJson(request)).invitation);});}

export async function GET(request:Request){return api(async()=>{const token=bearer(request);if(!token)throw new LicenseError(401,'Please sign in.');const account=await service().account(token);return new OrganisationService(licensingDb()).accountSummary(account.id);});}
