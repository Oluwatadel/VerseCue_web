CREATE TABLE IF NOT EXISTS vc_test_reports (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES vc_accounts(id) ON DELETE CASCADE,
 client_id text NOT NULL, payload_hash text NOT NULL, payload jsonb NOT NULL,
 title text NOT NULL, accent text NOT NULL DEFAULT '', platform text NOT NULL,
 summary jsonb NOT NULL, share_transcript boolean NOT NULL, training_consent boolean NOT NULL DEFAULT false,
 audio_key text, audio_bytes integer, audio_sha256 text,
 state text NOT NULL CHECK(state IN ('uploading','ready','deleting','deleted')),
 review_state text NOT NULL DEFAULT 'new' CHECK(review_state IN ('new','reviewed','excluded')),
 created_at timestamptz NOT NULL DEFAULT now(), consented_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days', deleted_at timestamptz,
 UNIQUE(account_id,client_id)
);
CREATE INDEX IF NOT EXISTS vc_test_reports_review ON vc_test_reports(state,created_at);
