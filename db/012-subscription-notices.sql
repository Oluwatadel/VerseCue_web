ALTER TABLE vc_email_outbox ADD COLUMN IF NOT EXISTS subscription_id uuid,
 ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
 ADD COLUMN IF NOT EXISTS subscription_notice text;

-- Old single-stage reminders have no expiry metadata; the job replaces them with current notices.
UPDATE vc_email_outbox SET state='cancelled',text_body='' WHERE state='queued' AND id LIKE 'expiry:%';
