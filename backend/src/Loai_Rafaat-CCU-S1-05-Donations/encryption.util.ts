import crypto from 'crypto';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';

// AES-256-GCM is authenticated encryption — it catches tampering, not just decryption errors
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;     // 128-bit IV for AES
const TAG_LENGTH = 16;    // 128-bit auth tag from GCM mode
const KEY_LENGTH = 32;    // 256-bit key

// Derive a consistent 32-byte key from the hex string in .env
const getKey = (): Buffer => {
  const keyHex = env.ENCRYPTION_KEY;
  // Belt-and-suspenders check: env.ts already validates this at startup via Zod,
  // but we assert again here so any future code path that bypasses env.ts still fails loudly.
  if (keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string. Generate one with: openssl rand -hex 32'
    );
  }
  return Buffer.from(keyHex, 'hex').subarray(0, KEY_LENGTH);
};

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a single string in the format: iv:tag:ciphertext (all base64)
 * This keeps the database column as one readable string, no extra columns needed.
 */
export const encrypt = (plaintext: string): string => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Store iv, auth tag, and ciphertext together so we can decrypt later
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
};

/**
 * Decrypts a string produced by encrypt().
 * Throws if the ciphertext has been tampered with (GCM authentication fails).
 */
export const decrypt = (encryptedString: string): string => {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format — expected iv:tag:ciphertext');
  }

  const [ivB64, tagB64, dataB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encryptedData = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString('utf8');
};

/**
 * Produces a SHA-256 hash of the plaintext for search-index purposes.
 * We store this alongside the encrypted value so lookups still work
 * without ever decrypting everything in bulk.
 *
 * IMPORTANT: this is a one-way hash — it cannot be reversed.
 * Use it only to answer "does record X match query Y?", not to recover the original value.
 *
 * SECURITY NOTE (H-5 fix): This HMAC uses ENCRYPTION_KEY as its key (same key for all records,
 * no per-record salting). This means:
 *   1. If ENCRYPTION_KEY is compromised, BOTH encryption AND hashing are broken simultaneously.
 *   2. An attacker with the key can pre-compute rainbow tables for predictable ID formats
 *      (e.g. A21CS####, MH22####) and look up all records.
 * Mitigation: Treat ENCRYPTION_KEY as a critical secret. If it is ever leaked, rotate BOTH
 * the encryption key AND re-hash all stored search hashes with a new key.
 */
export const hashForSearch = (plaintext: string): string => {
  return crypto
    .createHmac('sha256', env.ENCRYPTION_KEY)
    .update(plaintext.toLowerCase().trim())
    .digest('hex');
};

/**
 * Masks a student/volunteer ID so it's safe to show on screen.
 * Keeps the first 3 characters and last 2 characters, stars out the middle.
 *
 * Example:  A21CS0011  →  A21******11
 * Example:  V2024001   →  V20***01
 */
export const maskId = (plainId: string): string => {
  // L-3 fix: Always show exactly 2 real characters (first char + last char)
  // to avoid leaking the original ID length for short IDs.
  if (plainId.length <= 2) {
    return plainId[0] + '*'.repeat(Math.max(4, 8 - plainId.length));
  }
  const prefix = plainId.slice(0, 3);
  const suffix = plainId.slice(-2);
  const stars = '*'.repeat(Math.max(3, plainId.length - 5));
  return `${prefix}${stars}${suffix}`;
};

/**
 * Masks a Malaysian phone number: keeps first 3 digits and last 3 digits.
 * Works for formats like 0112345678 or 011-2345678
 *
 * Example:  0112345678  →  011-****-678
 * Example:  0123456789  →  012-****-789
 */
export const maskPhone = (phone: string): string => {
  // Strip everything except digits so we handle dashes/spaces consistently
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '***-****-***';

  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-3);
  return `${prefix}-****-${suffix}`;
};
