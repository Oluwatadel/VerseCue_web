CREATE TABLE IF NOT EXISTS vc_usage_minutes (
 account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 device_id text NOT NULL, minute_utc timestamptz NOT NULL,
 running_seconds integer NOT NULL CHECK(running_seconds BETWEEN 1 AND 60),
 active_seconds integer NOT NULL CHECK(active_seconds BETWEEN 0 AND running_seconds),
 received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,device_id,minute_utc)
);
CREATE INDEX IF NOT EXISTS vc_usage_by_minute ON vc_usage_minutes(minute_utc);
