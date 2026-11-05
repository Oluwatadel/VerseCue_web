ALTER TABLE vc_organisations ADD COLUMN IF NOT EXISTS multi_device boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS device_limit integer CHECK(device_limit IS NULL OR device_limit BETWEEN 2 AND 10000),
 ADD COLUMN IF NOT EXISTS owner_account_id uuid UNIQUE REFERENCES vc_accounts(id),
 ADD COLUMN IF NOT EXISTS paid_expires_at timestamptz;
CREATE TABLE IF NOT EXISTS vc_organisation_devices (
 organisation_id uuid NOT NULL REFERENCES vc_organisations(id) ON DELETE CASCADE,
 device_id text NOT NULL,account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 public_key text NOT NULL,device_name text NOT NULL,status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','released')),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(organisation_id,device_id)
);
ALTER TABLE vc_billing_orders ADD COLUMN IF NOT EXISTS computer_count integer NOT NULL DEFAULT 1 CHECK(computer_count BETWEEN 1 AND 10000),
 ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES vc_organisations(id);
ALTER TABLE vc_payment_receipts ADD COLUMN IF NOT EXISTS computer_count integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES vc_organisations(id);
ALTER TABLE vc_billing_orders ALTER COLUMN amount TYPE bigint;
ALTER TABLE vc_payment_receipts ALTER COLUMN amount TYPE bigint;
ALTER TABLE vc_payment_receipts DROP CONSTRAINT IF EXISTS vc_payment_receipts_status_check;
ALTER TABLE vc_payment_receipts ADD CONSTRAINT vc_payment_receipts_status_check CHECK(status IN ('paid','refunded','disputed','review'));
CREATE TABLE IF NOT EXISTS vc_paystack_seat_plans (
 mode text NOT NULL,plan_id text NOT NULL,computer_count integer NOT NULL,amount bigint NOT NULL,plan_code text NOT NULL,
 PRIMARY KEY(mode,plan_id,computer_count)
);
