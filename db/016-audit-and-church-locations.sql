ALTER TABLE vc_accounts ADD COLUMN IF NOT EXISTS church_location jsonb NOT NULL DEFAULT '{}';
ALTER TABLE vc_organisations ADD COLUMN IF NOT EXISTS church_location jsonb NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS vc_audit_events (
 id uuid PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now(),source text NOT NULL CHECK(source IN ('website','desktop','admin','billing')),
 action text NOT NULL,account_id uuid REFERENCES vc_accounts(id) ON DELETE SET NULL,organisation_id uuid REFERENCES vc_organisations(id) ON DELETE SET NULL,
 email text NOT NULL DEFAULT '',church_name text NOT NULL DEFAULT '',details jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS vc_audit_time ON vc_audit_events(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS vc_audit_account ON vc_audit_events(account_id,created_at DESC);
CREATE INDEX IF NOT EXISTS vc_audit_source ON vc_audit_events(source,created_at DESC);
CREATE OR REPLACE FUNCTION vc_capture_audit() RETURNS trigger AS 'DECLARE data jsonb; prior jsonb; acct uuid; org uuid; actor_email text; church_name text; origin text; activity text; extra jsonb;
BEGIN
 data=to_jsonb(NEW); prior=CASE WHEN TG_OP=''UPDATE'' THEN to_jsonb(OLD) ELSE ''{}''::jsonb END;
 origin=TG_ARGV[0]; activity=TG_ARGV[1];
 IF TG_TABLE_NAME=''vc_license_audit'' THEN
  activity=data->>''action'';
  IF activity IN (''issue'',''grant-complimentary'') THEN actor_email=data->>''subject''; END IF;
  SELECT a.id INTO acct FROM vc_accounts a WHERE a.email=data->>''subject'' OR a.id::text=data->>''subject'' LIMIT 1;
  IF acct IS NULL AND activity NOT IN (''issue'',''grant-complimentary'') THEN SELECT l.account_id,l.owner_email INTO acct,actor_email FROM vc_licenses l WHERE l.id::text=data->>''subject'' LIMIT 1; END IF;
  SELECT o.id INTO org FROM vc_organisations o WHERE o.id::text=split_part(data->>''subject'','':'',1) LIMIT 1;
 END IF;
 IF TG_OP=''UPDATE'' AND data=prior THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME=''vc_accounts'' THEN
  acct=(data->>''id'')::uuid;
  IF TG_OP=''UPDATE'' THEN
   IF data->>''status'' IS DISTINCT FROM prior->>''status'' THEN activity=''account.status-changed'';
   ELSIF data->>''device_id'' IS DISTINCT FROM prior->>''device_id'' THEN activity=''account.computer-changed'';
   ELSIF data->>''password_hash'' IS DISTINCT FROM prior->>''password_hash'' THEN activity=''account.password-changed'';
   ELSIF data->>''organisation_name'' IS DISTINCT FROM prior->>''organisation_name'' OR data->''church_location'' IS DISTINCT FROM prior->''church_location'' THEN activity=''church.profile-updated'';
   ELSE RETURN NEW; END IF;
  END IF;
 ELSIF TG_TABLE_NAME<>''vc_license_audit'' THEN acct=NULLIF(data->>''account_id'','''')::uuid; END IF;
 IF TG_TABLE_NAME=''vc_licenses'' THEN
  IF TG_OP=''UPDATE'' AND data->>''status''=prior->>''status'' AND data->>''account_id'' IS NOT DISTINCT FROM prior->>''account_id'' AND data->>''device_id'' IS NOT DISTINCT FROM prior->>''device_id'' AND data->>''expires_at'' IS NOT DISTINCT FROM prior->>''expires_at'' THEN RETURN NEW; END IF;
  actor_email=data->>''owner_email'';
 END IF;
 IF TG_TABLE_NAME=''vc_organisations'' THEN org=(data->>''id'')::uuid; church_name=data->>''name'';
 ELSIF TG_TABLE_NAME<>''vc_license_audit'' THEN org=NULLIF(data->>''organisation_id'','''')::uuid; END IF;
 IF TG_TABLE_NAME=''vc_sessions'' THEN
  IF data->>''kind''=''web'' THEN activity=''account.signed-in'';
  ELSIF data->>''kind''=''ai'' THEN origin=''desktop'';activity=''activation.issued'';
  ELSE origin=''desktop'';activity=''desktop.signed-in''; END IF;
 END IF;
 IF acct IS NOT NULL THEN SELECT COALESCE(actor_email,a.email),COALESCE(church_name,a.organisation_name) INTO actor_email,church_name FROM vc_accounts a WHERE a.id=acct; END IF;
 actor_email=COALESCE(actor_email,data->>''owner_email'','''');church_name=COALESCE(church_name,data->>''name'','''');
 extra=jsonb_strip_nulls(jsonb_build_object(''status'',data->>''status'',''plan'',data->>''plan_id'',''access'',data->>''access_kind'',''device'',data->>''device_name'',''expiry'',data->>''expires_at''));
 INSERT INTO vc_audit_events(id,source,action,account_id,organisation_id,email,church_name,details)
 VALUES(gen_random_uuid(),origin,activity,acct,org,actor_email,church_name,extra);
 RETURN NEW;
END;' LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_accounts;
CREATE TRIGGER vc_audit_capture AFTER INSERT OR UPDATE ON vc_accounts FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('website','account.registered');
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_licenses;
CREATE TRIGGER vc_audit_capture AFTER INSERT OR UPDATE ON vc_licenses FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('website','activation.changed');
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_sessions;
CREATE TRIGGER vc_audit_capture AFTER INSERT ON vc_sessions FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('website','account.signed-in');
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_downloads;
CREATE TRIGGER vc_audit_capture AFTER INSERT ON vc_downloads FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('website','download.windows');
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_payment_receipts;
CREATE TRIGGER vc_audit_capture AFTER INSERT OR UPDATE ON vc_payment_receipts FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('billing','payment.updated');
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_organisations;
CREATE TRIGGER vc_audit_capture AFTER INSERT OR UPDATE ON vc_organisations FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('admin','church.settings-changed');
DROP TRIGGER IF EXISTS vc_audit_capture ON vc_organisation_members;
CREATE TRIGGER vc_audit_capture AFTER INSERT OR UPDATE ON vc_organisation_members FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('admin','church.membership-changed');
INSERT INTO vc_audit_events(id,created_at,source,action,email,church_name,account_id)
SELECT l.id,l.created_at,'admin',l.action,COALESCE(a.email,''),COALESCE(a.organisation_name,''),a.id FROM vc_license_audit l
LEFT JOIN vc_accounts a ON a.email=l.subject OR a.id::text=l.subject
WHERE l.created_at>=now()-interval '30 days' ORDER BY l.created_at DESC LIMIT 10000 ON CONFLICT(id) DO NOTHING;

DROP TRIGGER IF EXISTS vc_audit_capture ON vc_license_audit;
CREATE TRIGGER vc_audit_capture AFTER INSERT ON vc_license_audit FOR EACH ROW EXECUTE FUNCTION vc_capture_audit('admin','admin.action');
