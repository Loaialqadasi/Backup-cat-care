// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

export type DonationStatus = 'pending' | 'verified' | 'rejected';

// what gets stored in the database and returned by the API
export interface Donation {
  id: number;
  donorName: string;
  donorEmail: string;
  claimedAmount: number;
  receiptUrl: string;
  status: DonationStatus;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// what the donor fills in when submitting a receipt
export interface SubmitDonationInput {
  donorName: string;
  donorEmail: string;
  claimedAmount: number;
}

// what the admin sends when approving or rejecting
export interface ReviewDonationInput {
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}

// the aggregate total shown on the public progress bar
export interface DonationProgress {
  totalVerified: number;
  goal: number;
  percentage: number;
}
