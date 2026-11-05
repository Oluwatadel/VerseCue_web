-- Free registration is independent of AI activation. Existing records are retained.
ALTER TABLE vc_accounts ADD COLUMN IF NOT EXISTS organisation_name text NOT NULL DEFAULT '';
ALTER TABLE vc_sessions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'ai'
 CHECK(kind IN ('web','free','ai'));
UPDATE vc_sessions SET kind='web' WHERE device_id IS NULL AND kind='ai';
CREATE TABLE IF NOT EXISTS vc_downloads (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now()
);
