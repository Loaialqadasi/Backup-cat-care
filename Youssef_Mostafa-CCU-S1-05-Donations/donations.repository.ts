// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { CreateDonationInput, Donation, DonationStatus } from './donations.types.js';

// Typed row interface matching donations table columns exactly
interface DonationRow {
  id: number;
  user_id: number;
  amount: string; // Postgres NUMERIC is returned as string — always parseFloat()
  image_url: string;
  status: DonationStatus;
  created_at: Date;
  updated_at: Date;
}

// Convert DB snake_case row → camelCase TS object
const mapDonation = (row: DonationRow): Donation => ({
  id: row.id,
  userId: row.user_id,
  amount: parseFloat(row.amount),
  imageUrl: row.image_url,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const donationsRepository = {
  async create(input: CreateDonationInput): Promise<Donation> {
    const { rows } = await db.query<DonationRow>(
      `INSERT INTO donations (user_id, amount, image_url)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, amount, image_url, status, created_at, updated_at`,
      [input.userId, input.amount, input.imageUrl]
    );
    return mapDonation(rows[0]);
  },

  // Duplicate guard: same user + same amount submitted within 60 seconds = duplicate
  async findRecentDuplicate(userId: number, amount: number): Promise<boolean> {
    const { rows } = await db.query<{ id: number }>(
      `SELECT id FROM donations
       WHERE user_id   = $1
         AND amount    = $2
         AND created_at > NOW() - INTERVAL '60 seconds'
       LIMIT 1`,
      [userId, amount]
    );
    return rows.length > 0;
  },
};
