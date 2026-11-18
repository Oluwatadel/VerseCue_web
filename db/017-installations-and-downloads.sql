ALTER TABLE vc_downloads ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'windows';
ALTER TABLE vc_downloads ADD COLUMN IF NOT EXISTS request_id text;
CREATE UNIQUE INDEX IF NOT EXISTS vc_download_request_id ON vc_downloads(request_id);
CREATE INDEX IF NOT EXISTS vc_download_platform_date ON vc_downloads(platform,created_at);
CREATE TABLE IF NOT EXISTS vc_installations (
 id text PRIMARY KEY, platform text NOT NULL, version text NOT NULL,
 first_seen timestamptz NOT NULL DEFAULT now(),last_seen timestamptz NOT NULL DEFAULT now(),
 reported_tier text NOT NULL DEFAULT 'free', account_id uuid REFERENCES vc_accounts(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS vc_installation_usage (
 installation_id text NOT NULL REFERENCES vc_installations(id) ON DELETE CASCADE,
 minute_utc timestamptz NOT NULL,running_seconds integer NOT NULL CHECK(running_seconds BETWEEN 1 AND 60),
 PRIMARY KEY(installation_id,minute_utc)
);
CREATE INDEX IF NOT EXISTS vc_installations_seen ON vc_installations(last_seen);
