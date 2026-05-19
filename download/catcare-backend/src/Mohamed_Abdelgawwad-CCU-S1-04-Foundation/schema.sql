-- CatCare UTM Database Setup
-- Import this file in phpMyAdmin: go to Import tab, select this file, and click Go.
-- Make sure to select a database first (or this will create one for you).

CREATE DATABASE IF NOT EXISTS catcare_utm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE catcare_utm;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS emergency_reports;
DROP TABLE IF EXISTS cats;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── Users ───
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','volunteer','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Cats ───
CREATE TABLE cats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nickname VARCHAR(100) NOT NULL,
  description TEXT NULL,
  photo_url VARCHAR(500) NULL,
  location_name VARCHAR(180) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  health_status ENUM('healthy','needs_attention','injured','unknown') NOT NULL DEFAULT 'unknown',
  ownership_tag ENUM('stray','adopted','campus_managed','unknown') NOT NULL DEFAULT 'unknown',
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cats_created_at (created_at),
  CONSTRAINT fk_cats_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Emergency Reports ───
CREATE TABLE emergency_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cat_id BIGINT UNSIGNED NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  emergency_type ENUM('injury','sickness','missing','feeding_urgent','danger','other') NOT NULL,
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'high',
  status ENUM('open','in_progress','resolved','cancelled') NOT NULL DEFAULT 'open',
  location_name VARCHAR(180) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  reported_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_emergency_reports_status (status),
  KEY idx_emergency_reports_priority (priority),
  KEY idx_emergency_reports_created_at (created_at),
  KEY idx_emergency_reports_cat_id (cat_id),
  CONSTRAINT fk_emergency_reports_cat FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE SET NULL,
  CONSTRAINT fk_emergency_reports_reported_by FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
