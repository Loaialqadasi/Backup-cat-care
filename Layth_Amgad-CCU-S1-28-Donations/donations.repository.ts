// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { DatabaseError, ConflictError, NotFoundError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { Donation, DonationProgress, DonationStatus, SubmitDonationInput } from './donations.types.js';

// matches the postgres snake_case column names exactly
interface DonationRow {
  id: number;
  donor_name: string;
  donor_email: string;
  claimed_amount: string; // postgres NUMERIC comes back as string
  receipt_url: string;
  status: DonationStatus;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// convert a raw postgres row into our clean Donation shape
const mapDonation = (row: DonationRow): Donation => ({
  id: row.id,
  donorName: row.donor_name,
  donorEmail: row.donor_email,
  claimedAmount: Number(row.claimed_amount),
  receiptUrl: row.receipt_url,
  status: row.status,
  reviewedByUserId: row.reviewed_by_user_id,
  reviewedAt: row.reviewed_at,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const donationsRepository = {
  // insert a new donation with the uploaded receipt path
  async create(input: SubmitDonationInput, receiptUrl: string): Promise<Donation> {
    try {
      const { rows } = await db.query<DonationRow>(
        `INSERT INTO donations (donor_name, donor_email, claimed_amount, receipt_url, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id, donor_name, donor_email, claimed_amount, receipt_url, status, reviewed_by_user_id, reviewed_at, rejection_reason, created_at, updated_at`,
        [input.donorName, input.donorEmail, input.claimedAmount, receiptUrl]
      );
      if (rows.length === 0) {
        throw new DatabaseError('Failed to save donation');
      }
      return mapDonation(rows[0]);
    } catch (err) {
      if (err instanceof DatabaseError) throw err;
      throw new DatabaseError('Failed to save donation', { cause: (err as Error).message });
    }
  },

  // admin dashboard — grab everything that still needs reviewing
  async findAllPending(page = 1, pageSize = 50): Promise<{ data: Donation[]; total: number }> {
    try {
      const offset = (page - 1) * pageSize;
      const { rows } = await db.query<DonationRow>(
        `SELECT id, donor_name, donor_email, claimed_amount, receipt_url, status, reviewed_by_user_id, reviewed_at, rejection_reason, created_at, updated_at FROM donations WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      );
      const countResult = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM donations WHERE status = 'pending'`
      );
      return { data: rows.map(mapDonation), total: Number(countResult.rows[0]?.count ?? 0) };
    } catch (err) {
      throw new DatabaseError('Failed to fetch pending donations', { cause: (err as Error).message });
    }
  },

  // look up a single donation — used before approving/rejecting
  async findById(id: number): Promise<Donation | null> {
    try {
      const { rows } = await db.query<DonationRow>(
        `SELECT id, donor_name, donor_email, claimed_amount, receipt_url, status, reviewed_by_user_id, reviewed_at, rejection_reason, created_at, updated_at FROM donations WHERE id = $1 LIMIT 1`,
        [id]
      );
      return rows.length > 0 ? mapDonation(rows[0]) : null;
    } catch (err) {
      throw new DatabaseError('Failed to fetch donation', { cause: (err as Error).message });
    }
  },

  // flip the status and record which admin reviewed it
  // atomic WHERE status = 'pending' prevents TOCTOU race condition
  async updateStatus(id: number, status: 'verified' | 'rejected', reviewedByUserId: number, rejectionReason?: string): Promise<Donation> {
    try {
      const { rows } = await db.query<DonationRow>(
        `UPDATE donations
         SET status = $1, reviewed_by_user_id = $2, reviewed_at = NOW(), rejection_reason = $4, updated_at = NOW()
         WHERE id = $3 AND status = 'pending'
         RETURNING id, donor_name, donor_email, claimed_amount, receipt_url, status, reviewed_by_user_id, reviewed_at, rejection_reason, created_at, updated_at`,
        [status, reviewedByUserId, id, status === 'rejected' ? (rejectionReason || null) : null]
      );
      if (rows.length === 0) {
        throw new ConflictError('Donation was already reviewed or does not exist');
      }
      return mapDonation(rows[0]);
    } catch (err) {
      if (err instanceof ConflictError) throw err;
      throw new DatabaseError('Failed to update donation status', { cause: (err as Error).message });
    }
  },

  // sum up all verified donations — this powers the public progress bar
  async getVerifiedTotal(): Promise<DonationProgress> {
    try {
      const { rows } = await db.query<{ total: string }>(
        `SELECT COALESCE(SUM(claimed_amount), 0)::text AS total FROM donations WHERE status = 'verified'`
      );
      const totalVerified = Number(rows[0]?.total ?? 0);
      // RM 10,000 fundraising goal — adjust this if the target changes
      const goal = 10_000;
      // prevent division by zero if goal is ever set to 0
      const percentage = goal > 0
        ? Math.min(100, Math.round((totalVerified / goal) * 100))
        : 0;
      return { totalVerified, goal, percentage };
    } catch (err) {
      throw new DatabaseError('Failed to calculate donation progress', { cause: (err as Error).message });
    }
  }
};
