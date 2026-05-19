// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)

export type DonationStatus = 'pending' | 'verified' | 'rejected';

export interface Donation {
  id: number;
  userId: number;
  amount: number;
  imageUrl: string;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationInput {
  userId: number;   // number — matches AuthUser.id from Foundation types
  amount: number;
  imageUrl: string;
}
