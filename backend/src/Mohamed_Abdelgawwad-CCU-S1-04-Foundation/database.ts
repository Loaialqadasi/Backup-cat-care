import pg from 'pg';
import { env } from './env.js';

// Build SSL config based on environment:
// - Production (Render, etc.): use CA cert if DATABASE_CA_CERT is provided, otherwise reject self-signed
// - Local development: no SSL (disable when DATABASE_HOST is localhost)
const buildSslConfig = (): pg.ConnectionConfig['ssl'] | undefined => {
  // No SSL for local development
  if (env.DATABASE_HOST === 'localhost' || env.DATABASE_HOST === '127.0.0.1') {
    return undefined;
  }

  // For managed databases (Render, etc.), use provided CA certificate
  if (process.env.DATABASE_CA_CERT) {
    return {
      ca: process.env.DATABASE_CA_CERT,
      rejectUnauthorized: true,
    };
  }

  // Production without explicit CA cert — reject unauthorized certificates
  return { rejectUnauthorized: true };
};

export const db = new pg.Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  ssl: buildSslConfig(),
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
