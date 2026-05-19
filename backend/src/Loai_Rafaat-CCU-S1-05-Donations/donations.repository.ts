import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { parsePagination, buildPagination, escapeLike } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/utils.js';
import { Pagination } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';
import { decrypt, maskId } from './encryption.util.js';
import { Donation, DonationAdminView, DonationRow, ReceiptStatus } from './donations.types.js';

// Map a raw database row to the public-facing Donation object.
// IDs are masked — callers never receive the real values unless they use mapRowAdminView.
const mapRow = (row: DonationRow): Donation => ({
  id: row.id,
  donorUserId: row.donor_user_id,
  donorName: row.donor_name,
  donorEmail: row.donor_email,
  amount: parseFloat(row.amount),
  currency: row.currency,
  message: row.message,
  // Show only masked ID — e.g. A21******11
  studentIdMasked:
    row.student_id_encrypted ? maskId(safeDecrypt(row.student_id_encrypted)) : null,
  volunteerIdMasked:
    row.volunteer_id_encrypted ? maskId(safeDecrypt(row.volunteer_id_encrypted)) : null,
  hasReceipt: !!row.receipt_file_path,
  receiptOriginalName: row.receipt_original_name,
  receiptSizeBytes: row.receipt_size_bytes,
  receiptStatus: row.receipt_status,
  adminNotes: row.admin_notes,
  reviewedByUserId: row.reviewed_by_user_id,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Admin view: same as above but includes the decrypted plaintext IDs
const mapRowAdminView = (row: DonationRow): DonationAdminView => ({
  ...mapRow(row),
  studentId: row.student_id_encrypted ? safeDecrypt(row.student_id_encrypted) : null,
  volunteerId: row.volunteer_id_encrypted ? safeDecrypt(row.volunteer_id_encrypted) : null,
  receiptFilePath: row.receipt_file_path,
});

// Decrypt without crashing the whole response if one record is corrupted
const safeDecrypt = (value: string): string => {
  try {
    return decrypt(value);
  } catch {
    // If decryption fails (e.g. key rotation in progress) return a safe placeholder
    return '[encrypted]';
  }
};

interface CreateDonationDbInput {
  donorUserId: number | null;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  message?: string;
  studentIdEncrypted?: string;
  volunteerIdEncrypted?: string;
  studentIdHash?: string;
  volunteerIdHash?: string;
  receiptFilePath?: string;
  receiptOriginalName?: string;
  receiptMimeType?: string;
  receiptSizeBytes?: number;
}

interface ListOptions {
  page?: number;
  pageSize?: number;
  status?: ReceiptStatus;
  search?: string; // matches donor name or email
  donorUserId?: number; // H-1: restrict to a specific donor's records
}

export const donationsRepository = {

  async create(input: CreateDonationDbInput): Promise<Donation> {
    const { rows } = await db.query<DonationRow>(
      `INSERT INTO donations (
        donor_user_id, donor_name, donor_email, amount, currency, message,
        student_id_encrypted, volunteer_id_encrypted,
        student_id_hash, volunteer_id_hash,
        receipt_file_path, receipt_original_name, receipt_mime_type, receipt_size_bytes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        input.donorUserId ?? null,
        input.donorName,
        input.donorEmail,
        input.amount,
        input.currency,
        input.message ?? null,
        input.studentIdEncrypted ?? null,
        input.volunteerIdEncrypted ?? null,
        input.studentIdHash ?? null,
        input.volunteerIdHash ?? null,
        input.receiptFilePath ?? null,
        input.receiptOriginalName ?? null,
        input.receiptMimeType ?? null,
        input.receiptSizeBytes ?? null,
      ]
    );
    return mapRow(rows[0]);
  },

  async findById(id: number): Promise<Donation | null> {
    const { rows } = await db.query<DonationRow>(
      'SELECT * FROM donations WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length ? mapRow(rows[0]) : null;
  },

  // Admin version: returns the decrypted IDs alongside everything else
  async findByIdAdmin(id: number): Promise<DonationAdminView | null> {
    const { rows } = await db.query<DonationRow>(
      'SELECT * FROM donations WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length ? mapRowAdminView(rows[0]) : null;
  },

  async list(options: ListOptions = {}): Promise<{ items: Donation[]; pagination: Pagination }> {
    const { page, pageSize, offset } = parsePagination(options.page, options.pageSize);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // H-1: non-admin users only see their own donations
    if (options.donorUserId) {
      conditions.push(`donor_user_id = $${paramIndex++}`);
      params.push(options.donorUserId);
    }

    if (options.status) {
      conditions.push(`receipt_status = $${paramIndex++}`);
      params.push(options.status);
    }

    if (options.search) {
      const pattern = `%${escapeLike(options.search)}%`;
      conditions.push(`(donor_name ILIKE $${paramIndex} OR donor_email ILIKE $${paramIndex + 1})`);
      params.push(pattern, pattern);
      paramIndex += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) FROM donations ${whereClause}`,
      params
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);

    const { rows } = await db.query<DonationRow>(
      `SELECT * FROM donations ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    return {
      items: rows.map(mapRow),
      pagination: buildPagination(page, pageSize, totalItems),
    };
  },

  // Admin list: same as list() but returns decrypted IDs
  async listAdmin(options: ListOptions = {}): Promise<{ items: DonationAdminView[]; pagination: Pagination }> {
    const { page, pageSize, offset } = parsePagination(options.page, options.pageSize);

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options.status) {
      conditions.push(`receipt_status = $${paramIndex++}`);
      params.push(options.status);
    }

    if (options.search) {
      const pattern = `%${escapeLike(options.search)}%`;
      conditions.push(`(donor_name ILIKE $${paramIndex} OR donor_email ILIKE $${paramIndex + 1})`);
      params.push(pattern, pattern);
      paramIndex += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) FROM donations ${whereClause}`,
      params
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);

    const { rows } = await db.query<DonationRow>(
      `SELECT * FROM donations ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    return {
      items: rows.map(mapRowAdminView),
      pagination: buildPagination(page, pageSize, totalItems),
    };
  },

  // Attach a receipt file to an existing donation (called after the file is persisted on disk)
  async attachReceipt(
    donationId: number,
    file: { filePath: string; originalName: string; mimeType: string; sizeBytes: number }
  ): Promise<Donation | null> {
    const { rows } = await db.query<DonationRow>(
      `UPDATE donations
       SET receipt_file_path     = $1,
           receipt_original_name = $2,
           receipt_mime_type     = $3,
           receipt_size_bytes    = $4,
           updated_at            = NOW()
       WHERE id = $5
       RETURNING *`,
      [file.filePath, file.originalName, file.mimeType, file.sizeBytes, donationId]
    );
    return rows.length ? mapRow(rows[0]) : null;
  },

  // Admin action: approve or reject a receipt
  async reviewReceipt(
    donationId: number,
    adminUserId: number,
    status: 'approved' | 'rejected',
    adminNotes?: string
  ): Promise<Donation | null> {
    const { rows } = await db.query<DonationRow>(
      `UPDATE donations
       SET receipt_status        = $1,
           admin_notes           = $2,
           reviewed_by_user_id   = $3,
           reviewed_at           = NOW(),
           updated_at            = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, adminNotes ?? null, adminUserId, donationId]
    );
    return rows.length ? mapRow(rows[0]) : null;
  },

  // Used for secure search: compare hashed input against hashed stored value
  async findByStudentIdHash(hash: string): Promise<Donation[]> {
    const { rows } = await db.query<DonationRow>(
      'SELECT * FROM donations WHERE student_id_hash = $1 ORDER BY created_at DESC',
      [hash]
    );
    return rows.map(mapRow);
  },

  async findByVolunteerIdHash(hash: string): Promise<Donation[]> {
    const { rows } = await db.query<DonationRow>(
      'SELECT * FROM donations WHERE volunteer_id_hash = $1 ORDER BY created_at DESC',
      [hash]
    );
    return rows.map(mapRow);
  },
};
