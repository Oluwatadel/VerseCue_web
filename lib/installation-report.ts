import type {LicensingDb} from './licensing-db';
import {LicenseError} from './licensing-security';
export function installationReportError(error:unknown){if(error instanceof LicenseError)return error;const value=error as {code?:string;cause?:{code?:string}};const code=value?.code||value?.cause?.code;
 if(code==='42P01'||code==='42703')return new LicenseError(503,'Download analytics database setup is incomplete. Apply migration 017-installations-and-downloads.sql using npm run db:migrate, then retry.');
 if(code==='42501')return new LicenseError(503,'Download analytics database permissions are insufficient. Allow the configured database role to read the analytics tables.');
 return new LicenseError(503,'Download analytics is temporarily unavailable. Check database connectivity and retry. Account activation settings do not control this report.');}
export async function installationReport(db:LicensingDb,filters:Record<string,string>){const query=(filters.q||'').slice(0,120),platform=filters.platform||'',from=filters.from||'1970-01-01',to=filters.to||'2999-12-31';
 const valid=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
 if(!valid(from)||!valid(to)||from>to)throw new LicenseError(400,'Choose valid dates with From no later than To.');
 if(!['','windows','android','ios'].includes(platform))throw new LicenseError(400,'Choose a supported platform.');
 try{
 const items=await db.query(`SELECT i.*,a.email,a.organisation_name,(SELECT sum(u.running_seconds)::double precision FROM vc_installation_usage u WHERE u.installation_id=i.id) AS seconds FROM vc_installations i LEFT JOIN vc_accounts a ON a.id=i.account_id WHERE i.last_seen >= $1::date AND i.last_seen < $2::date+interval '1 day' AND ($3='' OR i.platform=$3) AND ($4='' OR COALESCE(a.email,'') ILIKE $5 OR COALESCE(a.organisation_name,'') ILIKE $5 OR i.id ILIKE $5) ORDER BY i.last_seen DESC LIMIT 200`,[from,to,platform,query,'%'+query+'%']);
 const downloads=await db.query(`SELECT d.platform,d.created_at,a.email,a.organisation_name FROM vc_downloads d JOIN vc_accounts a ON a.id=d.account_id WHERE d.created_at >= $1::date AND d.created_at < $2::date+interval '1 day' AND ($3='' OR d.platform=$3) AND ($4='' OR a.email ILIKE $5 OR a.organisation_name ILIKE $5) ORDER BY d.created_at DESC LIMIT 200`,[from,to,platform,query,'%'+query+'%']);
 const totals=await db.query(`SELECT d.platform,count(*)::int AS downloads,max(d.created_at) AS latest_download FROM vc_downloads d JOIN vc_accounts a ON a.id=d.account_id WHERE d.created_at >= $1::date AND d.created_at < $2::date+interval '1 day' AND ($3='' OR d.platform=$3) AND ($4='' OR a.email ILIKE $5 OR a.organisation_name ILIKE $5) GROUP BY d.platform`,[from,to,platform,query,'%'+query+'%']);
 return {items,downloads,totals};
 }catch(error){throw installationReportError(error);}
}
