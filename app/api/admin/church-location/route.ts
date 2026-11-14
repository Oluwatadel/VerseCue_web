import {randomUUID} from 'node:crypto';
import {api,admin} from '../../../../lib/licensing-api';
import {licensingDb} from '../../../../lib/licensing-db';
import {readJson,LicenseError} from '../../../../lib/licensing-security';
import {churchLocation} from '../../../../lib/church-location';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{await admin(request);const body=await readJson(request),id=String(body.id||'');if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new LicenseError(400,'Invalid account.');const results=await licensingDb().transaction([{text:'UPDATE vc_accounts SET church_location=$2::jsonb WHERE id=$1 RETURNING id',values:[id,JSON.stringify(churchLocation(body.churchLocation))]},{text:"INSERT INTO vc_license_audit(id,action,subject) SELECT $1,'church:location-updated',id::text FROM vc_accounts WHERE id=$2",values:[randomUUID(),id]}]);if(!results[0].length)throw new LicenseError(404,'Account not found.');return {message:'Church location saved.'};});}
