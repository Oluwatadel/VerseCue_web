ALTER TABLE vc_email_outbox ADD COLUMN IF NOT EXISTS html_body text NOT NULL DEFAULT '';
