-- CatCare UTM Database Schema (PostgreSQL)
-- Run this in your PostgreSQL dashboard or PSQL console.

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

-- ─── Users ───
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

-- ─── Cats ───
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

-- ─── Emergency Reports ───
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