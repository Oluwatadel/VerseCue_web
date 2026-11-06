CREATE TABLE IF NOT EXISTS vc_pricing (
 id integer PRIMARY KEY CHECK(id=1), rates jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now()
);
