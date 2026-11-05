CREATE TABLE IF NOT EXISTS vc_billing_orders (
 reference text PRIMARY KEY, account_id uuid NOT NULL REFERENCES vc_accounts(id),
 plan_id text NOT NULL, months integer NOT NULL CHECK(months IN (1,6,12)),
 amount integer NOT NULL CHECK(amount>0), currency text NOT NULL DEFAULT 'NGN',
 auto_renew boolean NOT NULL, mode text NOT NULL CHECK(mode IN ('test','live')),
 plan_code text, customer_code text, authorization_url text,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','expired')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vc_one_pending_checkout ON vc_billing_orders(account_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS vc_payment_receipts (
 reference text PRIMARY KEY, transaction_id text NOT NULL UNIQUE,
 account_id uuid NOT NULL REFERENCES vc_accounts(id),plan_id text NOT NULL,months integer NOT NULL,
 amount integer NOT NULL,currency text NOT NULL,mode text NOT NULL,
 status text NOT NULL DEFAULT 'paid' CHECK(status IN ('paid','refunded','disputed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_billing_subscriptions (
 code text PRIMARY KEY, account_id uuid NOT NULL REFERENCES vc_accounts(id), order_reference text NOT NULL REFERENCES vc_billing_orders(reference),
 customer_code text NOT NULL,plan_code text NOT NULL,mode text NOT NULL,
 status text NOT NULL DEFAULT 'active',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_email_outbox (
 id text PRIMARY KEY,account_id uuid REFERENCES vc_accounts(id) ON DELETE CASCADE,
 recipient text NOT NULL,subject text NOT NULL,text_body text NOT NULL,
 state text NOT NULL DEFAULT 'queued',attempts integer NOT NULL DEFAULT 0,
 locked_at timestamptz,sent_at timestamptz,last_error text,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vc_password_resets (
 token_hash text PRIMARY KEY,account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
