-- Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
-- Assigned by: Loai Rafaat (Sprint Lead)
-- Run this AFTER the main schema.sql has already been applied on the database.

CREATE TYPE donation_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE donations (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  image_url     VARCHAR(500) NOT NULL,
  status        donation_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_user_id    ON donations (user_id);
CREATE INDEX idx_donations_status     ON donations (status);
CREATE INDEX idx_donations_created_at ON donations (created_at);
