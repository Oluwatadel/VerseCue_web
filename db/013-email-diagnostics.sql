ALTER TABLE vc_email_outbox ADD COLUMN IF NOT EXISTS provider_message_id text;
