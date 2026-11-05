import type {LicensingDb} from './licensing-db';
import {LicenseError,type Device} from './licensing-security';
export async function organisationAccess(db:LicensingDb,accountId:string){
 const [org]=await db.query(`SELECT o.* FROM vc_organisations o JOIN vc_organisation_members m ON m.organisation_id=o.id
 WHERE m.account_id=$1 AND m.status='approved' AND o.status='active' AND (o.unlimited_ai OR o.paid_expires_at>now())
 ORDER BY o.unlimited_ai DESC,o.created_at LIMIT 1`,[accountId]);return org;
}
export async function reserveComputer(db:LicensingDb,orgId:string,accountId:string,d:Device){
 // Lock first, then count in the next READ COMMITTED statement. Concurrent registrations cannot oversubscribe.
 const results=await db.transaction([
  {text:'SELECT id FROM vc_organisations WHERE id=$1 FOR UPDATE',values:[orgId]},
  {text:`INSERT INTO vc_organisation_devices(organisation_id,device_id,account_id,public_key,device_name)
   SELECT o.id,$2,$3,$4,$5 FROM vc_organisations o JOIN vc_organisation_members m ON m.organisation_id=o.id AND m.account_id=$3
   JOIN vc_accounts a ON a.id=m.account_id
   WHERE o.id=$1 AND o.status='active' AND a.status='active' AND m.status='approved' AND (o.unlimited_ai OR o.paid_expires_at>now())
   AND (o.multi_device OR (a.device_id=$2 AND a.device_public_key=$4))
   AND (o.device_limit IS NULL OR (SELECT count(*) FROM vc_organisation_devices WHERE organisation_id=o.id AND status='active')<o.device_limit
    OR EXISTS(SELECT 1 FROM vc_organisation_devices WHERE organisation_id=o.id AND device_id=$2 AND status='active'))
   ON CONFLICT(organisation_id,device_id) DO UPDATE SET status='active',device_name=EXCLUDED.device_name
   WHERE vc_organisation_devices.account_id=EXCLUDED.account_id AND vc_organisation_devices.public_key=EXCLUDED.public_key RETURNING device_id`,values:[orgId,d.id,accountId,d.publicKey,d.name]}
 ]);
 if(!results[1].length)throw new LicenseError(409,'Organisation computer access is unavailable or all computer places are in use. Ask your administrator to release a computer or change the access policy.');
}
