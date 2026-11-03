-- Additive migration: existing activations remain standard; no account/device bindings change.
ALTER TABLE vc_licenses ADD COLUMN IF NOT EXISTS access_kind text NOT NULL DEFAULT 'standard'
 CHECK(access_kind IN ('standard','complimentary'));
