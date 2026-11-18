import type {LicensingDb} from './licensing-db';
import {LicenseError} from './licensing-security';
export async function recordInstallation(db:LicensingDb,input:Record<string,unknown>,accountId:string|null=null){
 const {id,platform,version,tier,minute,seconds}=input;
 if(typeof id!=='string'||!/^i1-[a-f0-9]{32}$/.test(id)||!['windows','android','ios'].includes(String(platform))||typeof version!=='string'||!/^\d+\.\d+\.\d+(?:[.-][\w.-]{1,40})?$/.test(version)||!['free','paid'].includes(String(tier))||!Number.isSafeInteger(minute)||Number(minute)%60!==0||Math.abs(Number(minute)-Date.now()/1000)>86400||!Number.isInteger(seconds)||Number(seconds)<1||Number(seconds)>60)throw new LicenseError(400,'Invalid installation heartbeat.');
 await db.transaction([{text:`INSERT INTO vc_installations(id,platform,version,reported_tier,account_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET last_seen=now(),version=EXCLUDED.version,reported_tier=EXCLUDED.reported_tier,account_id=COALESCE(EXCLUDED.account_id,vc_installations.account_id) WHERE vc_installations.platform=EXCLUDED.platform`,values:[id,platform,version,tier,accountId]},
 {text:`INSERT INTO vc_installation_usage(installation_id,minute_utc,running_seconds) SELECT id,to_timestamp($2),$3 FROM vc_installations WHERE id=$1 AND platform=$4 ON CONFLICT(installation_id,minute_utc) DO UPDATE SET running_seconds=GREATEST(vc_installation_usage.running_seconds,EXCLUDED.running_seconds)`,values:[id,minute,seconds,platform]}]);
 return {received:true};
}
