CREATE TABLE IF NOT EXISTS vc_organisations (
 id uuid PRIMARY KEY,name text NOT NULL,status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
 unlimited_ai boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_organisation_members (
 organisation_id uuid NOT NULL REFERENCES vc_organisations(id) ON DELETE CASCADE,
 account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'approved' CHECK(status IN ('approved','removed')),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(organisation_id,account_id)
);
CREATE TABLE IF NOT EXISTS vc_organisation_invites (
 id uuid PRIMARY KEY,organisation_id uuid NOT NULL REFERENCES vc_organisations(id) ON DELETE CASCADE,
 email text NOT NULL,token_hash text NOT NULL UNIQUE,expires_at timestamptz NOT NULL,consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vc_email_outbox ADD COLUMN IF NOT EXISTS activation_license_id uuid REFERENCES vc_licenses(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS vc_support_requests (
 id uuid PRIMARY KEY,account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 category text NOT NULL CHECK(category IN ('general','activation','billing','device-reset','organisation','bug')),
 subject text NOT NULL,description text NOT NULL,status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in-progress','awaiting-user','resolved')),
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','high')),assigned_to text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_support_messages (
 id uuid PRIMARY KEY,request_id uuid NOT NULL REFERENCES vc_support_requests(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('user','admin','internal')),body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vc_support_account ON vc_support_requests(account_id,updated_at);
CREATE INDEX IF NOT EXISTS vc_organisation_account ON vc_organisation_members(account_id);
