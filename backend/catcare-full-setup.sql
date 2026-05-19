-- ============================================
-- CatCare UTM — Full Database Setup (PostgreSQL)
-- ============================================
-- Run this in the Render PostgreSQL dashboard:
--   1. Go to your database dashboard on Render
--   2. Click "PSQL Command" or open the SQL editor
--   3. Paste this entire script
--   4. Execute
-- ============================================

-- ─── Custom ENUM Types ───
CREATE TYPE user_role AS ENUM ('student', 'volunteer', 'admin');
CREATE TYPE cat_health_status AS ENUM ('healthy', 'needs_attention', 'injured', 'unknown');
CREATE TYPE cat_ownership_tag AS ENUM ('stray', 'adopted', 'campus_managed', 'unknown');
CREATE TYPE emergency_type AS ENUM ('injury', 'sickness', 'missing', 'feeding_urgent', 'danger', 'other');
CREATE TYPE emergency_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE emergency_status AS ENUM ('open', 'in_progress', 'resolved', 'cancelled');

-- ─── Drop existing tables ───
DROP TABLE IF EXISTS emergency_reports CASCADE;
DROP TABLE IF EXISTS cats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── Users Table ───
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users (email);

-- ─── Cats Table ───
CREATE TABLE cats (
  id BIGSERIAL PRIMARY KEY,
  nickname VARCHAR(100) NOT NULL,
  description TEXT NULL,
  photo_url VARCHAR(500) NULL,
  location_name VARCHAR(180) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  health_status cat_health_status NOT NULL DEFAULT 'unknown',
  ownership_tag cat_ownership_tag NOT NULL DEFAULT 'unknown',
  created_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cats_created_at ON cats (created_at);

-- ─── Emergency Reports Table ───
CREATE TABLE emergency_reports (
  id BIGSERIAL PRIMARY KEY,
  cat_id BIGINT NULL REFERENCES cats(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  emergency_type emergency_type NOT NULL,
  priority emergency_priority NOT NULL DEFAULT 'high',
  status emergency_status NOT NULL DEFAULT 'open',
  location_name VARCHAR(180) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  reported_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_emergency_reports_status ON emergency_reports (status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports (priority);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports (created_at);
CREATE INDEX idx_emergency_reports_cat_id ON emergency_reports (cat_id);

-- ─── Seed Data ───
-- Default password for all accounts: password123

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User', 'admin@utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'admin'),
  ('Student User', 'student@graduate.utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'student');

INSERT INTO cats (nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id) VALUES
  ('Oyen Library', 'Friendly orange cat usually seen near the library.', 'https://placecats.com/millie/400/300', 'UTM Library', 1.5589000, 103.6389000, 'healthy', 'campus_managed', 2),
  ('Grey Canteen', 'Shy grey cat often near the cafeteria.', 'https://placecats.com/millie/400/300', 'UTM Cafeteria', 1.5600000, 103.6400000, 'needs_attention', 'stray', 2),
  ('Kucing Tepi Jalan', 'Black and white cat that hangs around the main road.', 'https://placecats.com/millie/400/300', 'UTM Main Road', 1.5595000, 103.6395000, 'healthy', 'stray', 2),
  ('Milo Dorm', 'Tabby cat adopted by students at the dormitory.', 'https://placecats.com/millie/400/300', 'UTM Dormitory Block A', 1.5610000, 103.6410000, 'healthy', 'adopted', 2),
  ('Putih Engineering', 'White cat with blue eyes near the engineering faculty.', 'https://placecats.com/millie/400/300', 'UTM Engineering Faculty', 1.5590000, 103.6380000, 'injured', 'campus_managed', 2),
  ('Shadow Parking', 'Dark grey cat that lives in the parking area.', 'https://placecats.com/millie/400/300', 'UTM Parking Lot B', 1.5605000, 103.6405000, 'healthy', 'stray', 2),
  ('Ginger Mosque', 'Orange cat always sleeping near the mosque.', 'https://placecats.com/millie/400/300', 'UTM Mosque', 1.5598000, 103.6392000, 'needs_attention', 'campus_managed', 2),
  ('Bulat Sports', 'Round fluffy cat near the sports complex.', 'https://placecats.com/millie/400/300', 'UTM Sports Complex', 1.5602000, 103.6398000, 'healthy', 'stray', 2);

INSERT INTO emergency_reports (cat_id, title, description, emergency_type, priority, status, location_name, latitude, longitude, reported_by_user_id) VALUES
  (1, 'Injured cat near cafeteria', 'Cat appears to have an injured leg and needs urgent help.', 'injury', 'critical', 'open', 'UTM Cafeteria', 1.5600000, 103.6400000, 2),
  (2, 'Cat missing near dorm', 'Grey cat missing since last night, last seen near dorm entrance.', 'missing', 'high', 'in_progress', 'UTM Dorm Entrance', 1.5590000, 103.6370000, 2),
  (5, 'Injured white cat at engineering', 'The white cat near engineering faculty seems to have a cut on its paw.', 'injury', 'high', 'open', 'UTM Engineering Faculty', 1.5590000, 103.6380000, 2),
  (7, 'Ginger cat not eating', 'The orange cat near the mosque has not been eating for 2 days.', 'sickness', 'medium', 'open', 'UTM Mosque', 1.5598000, 103.6392000, 2),
  (NULL, 'Stray kitten at parking lot', 'Found a small kitten alone at the parking lot, looks very young.', 'danger', 'critical', 'open', 'UTM Parking Lot B', 1.5605000, 103.6405000, 2),
  (3, 'Kucing Tepi Jalan needs food', 'The black and white cat near main road seems underweight.', 'feeding_urgent', 'medium', 'resolved', 'UTM Main Road', 1.5595000, 103.6395000, 2);

-- ─── Donations Table (SCRUM-30 / TG-1) ───
-- receipt_status enum
DO $$ BEGIN
  CREATE TYPE receipt_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TABLE IF EXISTS donations CASCADE;

CREATE TABLE donations (
  id                      BIGSERIAL PRIMARY KEY,
  donor_user_id           BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  donor_name              VARCHAR(120) NOT NULL,
  donor_email             VARCHAR(160) NOT NULL,
  amount                  NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency                CHAR(3) NOT NULL DEFAULT 'MYR',
  message                 TEXT NULL,
  -- TG-1: IDs are AES-256-GCM encrypted — raw values are never stored
  student_id_encrypted    TEXT NULL,
  volunteer_id_encrypted  TEXT NULL,
  student_id_hash         TEXT NULL,
  volunteer_id_hash       TEXT NULL,
  receipt_file_path       TEXT NULL,
  receipt_original_name   VARCHAR(255) NULL,
  receipt_mime_type       VARCHAR(100) NULL,
  receipt_size_bytes      INTEGER NULL,
  receipt_status          receipt_status NOT NULL DEFAULT 'pending',
  admin_notes             TEXT NULL,
  reviewed_by_user_id     BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_receipt_status    ON donations (receipt_status);
CREATE INDEX idx_donations_created_at        ON donations (created_at);
CREATE INDEX idx_donations_donor_user_id     ON donations (donor_user_id);
CREATE INDEX idx_donations_student_id_hash   ON donations (student_id_hash)   WHERE student_id_hash IS NOT NULL;
CREATE INDEX idx_donations_volunteer_id_hash ON donations (volunteer_id_hash) WHERE volunteer_id_hash IS NOT NULL;



-- ─── Auto-update updated_at trigger (M-8) ───
-- Automatically sets updated_at = NOW() on every row update,
-- so ad-hoc UPDATE queries that forget to set it manually still get correct timestamps.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cats_updated_at
  BEFORE UPDATE ON cats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();