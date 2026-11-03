-- Apply explicitly to the configured Postgres database before enabling activation.
CREATE TABLE IF NOT EXISTS vc_accounts (
 id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','blocked')),
 device_id text, device_public_key text, device_name text,
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_licenses (
 id uuid PRIMARY KEY, owner_email text NOT NULL, code_hash text UNIQUE NOT NULL,
 account_id uuid REFERENCES vc_accounts(id), device_id text,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), activated_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS vc_one_active_license_per_owner ON vc_licenses(owner_email) WHERE status='active';
CREATE TABLE IF NOT EXISTS vc_sessions (
 token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 device_id text, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_challenges (nonce_hash text PRIMARY KEY, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS vc_auth_buckets (key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL);
CREATE TABLE IF NOT EXISTS vc_license_audit (
 id uuid PRIMARY KEY, action text NOT NULL, subject text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
