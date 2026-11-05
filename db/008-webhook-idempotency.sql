CREATE TABLE IF NOT EXISTS vc_webhook_events (
 mode text NOT NULL CHECK(mode IN ('test','live')),event_key text NOT NULL,event_type text NOT NULL,
 status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','processed','failed')),
 lease_token uuid NOT NULL,locked_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,last_error text,
 PRIMARY KEY(mode,event_key)
);
CREATE TABLE IF NOT EXISTS vc_payment_guards (
 reference text NOT NULL,mode text NOT NULL CHECK(mode IN ('test','live')),
 reversal_status text CHECK(reversal_status IN ('refunded','disputed')),PRIMARY KEY(reference,mode)
);
CREATE TABLE IF NOT EXISTS vc_subscription_states (
 code text NOT NULL,mode text NOT NULL CHECK(mode IN ('test','live')),
 status text NOT NULL CHECK(status IN ('active','not-renewing','disabled')),PRIMARY KEY(code,mode)
);
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS external_key text UNIQUE;
INSERT INTO vc_subscription_states(code,mode,status) SELECT code,mode,status FROM vc_billing_subscriptions
 ON CONFLICT(code,mode) DO NOTHING;
