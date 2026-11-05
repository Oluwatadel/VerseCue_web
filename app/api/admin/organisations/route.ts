import {api,admin} from "../../../../lib/licensing-api";
import {readJson,LicenseError} from "../../../../lib/licensing-security";
import {licensingDb} from "../../../../lib/licensing-db";
import {OrganisationService} from "../../../../lib/organisation-service";
export const runtime="nodejs";
export async function GET(request:Request){return api(async()=>{await admin(request);return new OrganisationService(licensingDb()).list();});}
export async function POST(request:Request){return api(async()=>{await admin(request);const body=await readJson(request);const s=new OrganisationService(licensingDb());if(body.action==='create')return s.create(body.name,body.unlimitedAi,body.multiDevice,body.deviceLimit);if(body.action==='update')return s.update(body.id,body.name,body.unlimitedAi,body.status,body.multiDevice,body.deviceLimit,body.paidUntil);if(body.action==='release-computer')return s.releaseComputer(body.id,body.deviceId);if(body.action==='add-member')return s.addMember(body.id,body.email);if(body.action==='remove-member')return s.removeMember(body.id,body.accountId);throw new LicenseError(400,'Unknown action.');});}
