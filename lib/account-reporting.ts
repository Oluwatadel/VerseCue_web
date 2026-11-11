import type {LicensingDb} from './licensing-db';
const REPORT=`SELECT a.id,a.email,a.organisation_name,a.status,a.device_name,a.device_id,a.created_at AS registered_at,a.created_at,
 COALESCE(d.downloads,0) AS downloads,d.first_download_at,d.last_download_at,
 COALESCE(u.running_seconds,0)::float8 AS running_seconds,COALESCE(u.active_seconds,0)::float8 AS active_seconds,u.last_seen,
 access.id AS subscription_id,access.expires_at AS subscription_expires_at,access.access_kind,access.source AS subscription_source,
 CASE WHEN a.status<>'active' THEN 'blocked' WHEN access.id IS NULL THEN 'free' WHEN access.status<>'active' THEN 'revoked'
 WHEN access.expires_at<=now() THEN 'expired' WHEN access.expires_at IS NULL OR access.access_kind='complimentary' THEN 'complimentary' ELSE 'active' END AS subscription_status,
 CASE WHEN (access.expires_at IS NULL OR access.access_kind='complimentary') AND access.id IS NOT NULL THEN 'complimentary' ELSE paid.plan_id END AS plan_id,paid.created_at AS subscribed_at,paid.computer_count
 FROM vc_accounts a
 LEFT JOIN (SELECT account_id,count(*)::int AS downloads,min(created_at) AS first_download_at,max(created_at) AS last_download_at FROM vc_downloads GROUP BY account_id)d ON d.account_id=a.id
 LEFT JOIN (SELECT account_id,sum(running_seconds) AS running_seconds,sum(active_seconds) AS active_seconds,max(minute_utc) AS last_seen FROM vc_usage_minutes GROUP BY account_id)u ON u.account_id=a.id
 LEFT JOIN LATERAL (SELECT * FROM (
 SELECT l.id,l.expires_at,l.status,l.access_kind,'personal'::text AS source,l.created_at FROM vc_licenses l WHERE l.account_id=a.id
 UNION ALL SELECT o.id,CASE WHEN o.unlimited_ai THEN NULL ELSE o.paid_expires_at END,o.status,CASE WHEN o.unlimited_ai THEN 'complimentary' ELSE 'organisation' END,'organisation'::text,o.created_at
 FROM vc_organisations o JOIN vc_organisation_members m ON m.organisation_id=o.id WHERE m.account_id=a.id AND m.status='approved' AND (o.unlimited_ai OR o.paid_expires_at IS NOT NULL)) grants
 ORDER BY CASE WHEN status='active' AND (expires_at IS NULL OR expires_at>now()) THEN 0 WHEN status='active' THEN 1 ELSE 2 END,expires_at DESC NULLS FIRST,created_at DESC LIMIT 1) access ON true
 LEFT JOIN LATERAL (SELECT p.plan_id,p.created_at,p.computer_count FROM vc_payment_receipts p WHERE p.status='paid'
 AND ((access.source='organisation' AND p.organisation_id=access.id) OR (access.source='personal' AND p.account_id=a.id AND p.organisation_id IS NULL)) ORDER BY p.created_at DESC LIMIT 1) paid ON true`;
export async function accountSummaries(db:LicensingDb,limit=100){return db.query(REPORT+' ORDER BY u.last_seen DESC NULLS LAST,a.created_at DESC LIMIT $1',[limit]);}
export async function subscriptionTotals(db:LicensingDb){const [totals]=await db.query(`WITH reports AS (${REPORT}) SELECT
 count(*) FILTER(WHERE subscription_status='active')::int AS active_subscribers,
 count(*) FILTER(WHERE subscription_status='active' AND subscription_expires_at<=now()+interval '7 days')::int AS expiring_soon,
 count(*) FILTER(WHERE subscription_status='expired')::int AS expired_subscribers,
 count(*) FILTER(WHERE subscription_status='complimentary')::int AS complimentary_accounts,
 count(*) FILTER(WHERE subscription_status='free')::int AS free_accounts,
 count(*) FILTER(WHERE subscription_status IN ('blocked','revoked'))::int AS restricted_accounts FROM reports`);return totals;}
