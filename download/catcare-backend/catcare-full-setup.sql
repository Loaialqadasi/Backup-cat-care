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
CREATE TYPE donation_status AS ENUM ('pending', 'verified', 'rejected');

-- ─── Drop existing tables ───
DROP TABLE IF EXISTS emergency_reports CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
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

-- ─── Donations Table ───
CREATE TABLE donations (
  id BIGSERIAL PRIMARY KEY,
  donor_name VARCHAR(120) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  receipt_url VARCHAR(500) NOT NULL,
  note VARCHAR(500) NULL,
  status donation_status NOT NULL DEFAULT 'pending',
  created_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  verified_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_donations_status ON donations (status);
CREATE INDEX idx_donations_verified_at ON donations (verified_at DESC);
CREATE INDEX idx_donations_created_at ON donations (created_at DESC);

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

INSERT INTO donations (donor_name, amount, receipt_url, note, status, created_by_user_id, verified_by_user_id, verified_at) VALUES
  ('Amir Zulkifli', 120.00, '/uploads/receipts/sample-receipt-1.pdf', 'For emergency treatment supplies', 'verified', 2, 1, NOW() - INTERVAL '2 days'),
  ('Nadia Rahman', 85.50, '/uploads/receipts/sample-receipt-2.jpg', 'Hope this helps the cats', 'verified', 2, 1, NOW() - INTERVAL '1 day'),
  ('Syed Hamdan', 40.00, '/uploads/receipts/sample-receipt-3.png', NULL, 'pending', 2, NULL, NULL),
  ('Afiq Daniel', 25.00, '/uploads/receipts/sample-receipt-4.png', NULL, 'rejected', 2, NULL, NULL),
  ('Aisyah Karim', 200.00, '/uploads/receipts/sample-receipt-5.pdf', 'For vaccination program', 'verified', 2, 1, NOW() - INTERVAL '4 hours');
