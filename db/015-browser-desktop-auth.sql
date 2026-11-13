CREATE TABLE IF NOT EXISTS vc_desktop_auth (
 code_hash text PRIMARY KEY,
 user_code text UNIQUE NOT NULL,
 device jsonb NOT NULL,
 account_id uuid REFERENCES vc_accounts(id),
 claimed boolean NOT NULL DEFAULT false,
 result jsonb,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes'
);
CREATE INDEX IF NOT EXISTS vc_desktop_auth_expiry ON vc_desktop_auth(expires_at);
