ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS app_version text NOT NULL DEFAULT '';
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT '';
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS steps_to_reproduce text NOT NULL DEFAULT '';
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS resolution_summary text NOT NULL DEFAULT '';
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS customer_rating integer CHECK(customer_rating BETWEEN 1 AND 5);
ALTER TABLE vc_support_requests ADD COLUMN IF NOT EXISTS customer_feedback text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS vc_support_status_updated ON vc_support_requests(status,updated_at DESC);
