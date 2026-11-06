CREATE TABLE IF NOT EXISTS vc_activation_requests (
 id uuid PRIMARY KEY,account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 device_id text NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','activated','expired')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',created_at timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS vc_one_pending_activation ON vc_activation_requests(account_id,device_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS vc_activation_keys (
 id uuid UNIQUE NOT NULL,code_hash text PRIMARY KEY,account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',device_id text,redeemed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
