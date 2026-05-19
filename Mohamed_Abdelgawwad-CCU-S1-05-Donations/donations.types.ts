import { Pagination } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

export type DonationStatus = 'pending' | 'verified' | 'rejected';

export interface Donation {
  id: number;
  donorName: string;
  amount: number;
  receiptUrl: string;
  note: string | null;
  status: DonationStatus;
  createdByUserId: number | null;
  verifiedByUserId: number | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationInput {
  donorName: string;
  amount: number;
  receiptUrl: string;
  note?: string | null;
  createdByUserId: number | null;
}

export interface DonationListQuery {
  page?: number;
  pageSize?: number;
  status?: DonationStatus;
}

export interface DonationListResult {
  items: Donation[];
  pagination: Pagination;
}

export interface PublicDonor {
  maskedName: string;
  amount: number;
  verifiedAt: string;
}

export interface DonationProgress {
  totalVerifiedAmount: number;
  goalAmount: number;
  percentage: number;
  achieved: boolean;
  recentVerifiedDonors: PublicDonor[];
}
