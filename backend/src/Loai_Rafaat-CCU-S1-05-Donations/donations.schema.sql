-- ============================================================
-- CatCare UTM — Donations & Receipt Storage (SCRUM-30 / TG-1)
-- ============================================================
-- Run this after the base schema.sql has been applied.
-- It adds the donations table and a donation_status enum.
-- ============================================================

-- Receipt review status — starts at pending, admin moves it to approved or rejected
DO $$ BEGIN
  CREATE TYPE receipt_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop and recreate if re-running during development
DROP TABLE IF EXISTS donations CASCADE;

CREATE TABLE donations (
  id                      BIGSERIAL PRIMARY KEY,

  -- Who donated — nullable so guests can donate without an account
  donor_user_id           BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  donor_name              VARCHAR(120) NOT NULL,
  donor_email             VARCHAR(160) NOT NULL,

  -- Financial details
  amount                  NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency                CHAR(3) NOT NULL DEFAULT 'MYR',
  message                 TEXT NULL,

  -- TG-1: Sensitive identifiers are NEVER stored as plain text.
  -- The encrypted columns hold AES-256-GCM ciphertext (iv:tag:ciphertext, base64).
  -- The hash columns hold HMAC-SHA256 digests used only for equality search.
  student_id_encrypted    TEXT NULL,
  volunteer_id_encrypted  TEXT NULL,
  student_id_hash         TEXT NULL,   -- for search without decrypting
  volunteer_id_hash       TEXT NULL,   -- for search without decrypting

  -- Uploaded payment proof
  receipt_file_path       TEXT NULL,
  receipt_original_name   VARCHAR(255) NULL,
  receipt_mime_type       VARCHAR(100) NULL,
  receipt_size_bytes      INTEGER NULL,
  receipt_status          receipt_status NOT NULL DEFAULT 'pending',

  -- Admin review
  admin_notes             TEXT NULL,
  reviewed_by_user_id     BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ NULL,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins filter by status constantly — this index makes that fast
CREATE INDEX idx_donations_receipt_status   ON donations (receipt_status);
CREATE INDEX idx_donations_created_at       ON donations (created_at);
CREATE INDEX idx_donations_donor_user_id    ON donations (donor_user_id);

-- Hash-based search indexes so lookups work without decrypting anything
CREATE INDEX idx_donations_student_id_hash  ON donations (student_id_hash)   WHERE student_id_hash IS NOT NULL;
CREATE INDEX idx_donations_volunteer_id_hash ON donations (volunteer_id_hash) WHERE volunteer_id_hash IS NOT NULL;



-- ─── Auto-update updated_at trigger (M-8) ───
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();