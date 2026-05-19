import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { Donation, DonationStatus, CreateDonationInput } from './donations.types.js';

interface DonationRow {
  id: number;
  donor_name: string;
  amount: string;
  receipt_url: string;
  note: string | null;
  status: DonationStatus;
  created_by_user_id: number | null;
  verified_by_user_id: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface VerifiedDonorRow {
  donor_name: string;
  amount: string;
  verified_at: string;
}

const mapDonation = (row: DonationRow): Donation => ({
  id: row.id,
  donorName: row.donor_name,
  amount: Number(row.amount),
  receiptUrl: row.receipt_url,
  note: row.note,
  status: row.status,
  createdByUserId: row.created_by_user_id,
  verifiedByUserId: row.verified_by_user_id,
  verifiedAt: row.verified_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const buildWhereClause = (status: DonationStatus | undefined, params: Array<string | number>): string => {
  if (!status) {
    return '';
  }
  params.push(status);
  return `WHERE status = $${params.length}`;
};

export const donationsRepository = {
  async create(input: CreateDonationInput): Promise<Donation> {
    const { rows } = await db.query<DonationRow>(
      `INSERT INTO donations (donor_name, amount, receipt_url, note, status, created_by_user_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id, donor_name, amount, receipt_url, note, status, created_by_user_id, verified_by_user_id, verified_at, created_at, updated_at`,
      [input.donorName, input.amount, input.receiptUrl, input.note ?? null, input.createdByUserId]
    );

    return mapDonation(rows[0]);
  },

  async list(status: DonationStatus | undefined, limit: number, offset: number): Promise<Donation[]> {
    const params: Array<string | number> = [];
    const whereClause = buildWhereClause(status, params);
    const { rows } = await db.query<DonationRow>(
      `SELECT id, donor_name, amount, receipt_url, note, status, created_by_user_id, verified_by_user_id, verified_at, created_at, updated_at
       FROM donations
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return rows.map(mapDonation);
  },

  async count(status?: DonationStatus): Promise<number> {
    const params: Array<string | number> = [];
    const whereClause = buildWhereClause(status, params);
    const { rows } = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM donations ${whereClause}`,
      params
    );

    return Number(rows[0]?.count ?? 0);
  },

  async updateStatus(id: number, status: DonationStatus, verifiedByUserId: number): Promise<Donation | null> {
    const shouldVerify = status === 'verified';
    const { rows } = await db.query<DonationRow>(
      `UPDATE donations
       SET status = $2,
           verified_by_user_id = CASE WHEN $2 = 'verified' THEN $3 ELSE NULL END,
           verified_at = CASE WHEN $2 = 'verified' THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, donor_name, amount, receipt_url, note, status, created_by_user_id, verified_by_user_id, verified_at, created_at, updated_at`,
      [id, status, shouldVerify ? verifiedByUserId : null]
    );

    if (rows.length === 0) {
      return null;
    }

    return mapDonation(rows[0]);
  },

  async getVerifiedTotal(): Promise<number> {
    const { rows } = await db.query<{ total: string | null }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS total
       FROM donations
       WHERE status = 'verified'`
    );

    return Number(rows[0]?.total ?? 0);
  },

  async getRecentVerifiedDonors(limit = 5): Promise<Array<{ donorName: string; amount: number; verifiedAt: string }>> {
    const { rows } = await db.query<VerifiedDonorRow>(
      `SELECT donor_name, amount, verified_at
       FROM donations
       WHERE status = 'verified' AND verified_at IS NOT NULL
       ORDER BY verified_at DESC
       LIMIT $1`,
      [limit]
    );

    return rows.map((row) => ({
      donorName: row.donor_name,
      amount: Number(row.amount),
      verifiedAt: row.verified_at
    }));
  }
};
