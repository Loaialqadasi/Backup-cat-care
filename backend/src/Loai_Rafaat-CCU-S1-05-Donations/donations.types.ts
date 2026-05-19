// Donation receipt status — tracks where a receipt is in the admin review flow
export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

// What comes back from the database for a donation record
export interface DonationRow {
  id: number;
  donor_user_id: number | null;
  donor_name: string;
  donor_email: string;
  amount: string;                      // numeric comes back as string from pg
  currency: string;
  message: string | null;
  student_id_encrypted: string | null; // AES-256-GCM encrypted, never plain text
  volunteer_id_encrypted: string | null;
  student_id_hash: string | null;      // HMAC-SHA256 — for search without decrypting
  volunteer_id_hash: string | null;
  receipt_file_path: string | null;
  receipt_original_name: string | null;
  receipt_mime_type: string | null;
  receipt_size_bytes: number | null;
  receipt_status: ReceiptStatus;
  admin_notes: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// The clean object returned to API callers — IDs are either masked or omitted
export interface Donation {
  id: number;
  donorUserId: number | null;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  message: string | null;
  // Public-facing: masked IDs only (e.g. A21******11 — never the real value)
  studentIdMasked: string | null;
  volunteerIdMasked: string | null;
  hasReceipt: boolean;
  receiptOriginalName: string | null;
  receiptSizeBytes: number | null;
  receiptStatus: ReceiptStatus;
  adminNotes: string | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Admin view includes the decrypted IDs — only returned to admin-role requests
export interface DonationAdminView extends Donation {
  studentId: string | null;   // decrypted — never log or cache this
  volunteerId: string | null; // decrypted — never log or cache this
  receiptFilePath: string | null; // internal path — only admins need this for download
}

// What the donor submits when creating a donation
export interface CreateDonationInput {
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  message?: string;
  studentId?: string;   // plain — we encrypt before touching the database
  volunteerId?: string; // plain — we encrypt before touching the database
}

// What the admin submits when reviewing a receipt
export interface ReviewReceiptInput {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}
