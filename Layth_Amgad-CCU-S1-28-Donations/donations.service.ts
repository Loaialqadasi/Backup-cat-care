// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { ConflictError, NotFoundError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { donationsRepository } from './donations.repository.js';
import { Donation, DonationProgress, SubmitDonationInput } from './donations.types.js';

export const donationsService = {
  // donor uploads a receipt — file path comes from multer after it's saved to disk
  async submitDonation(input: SubmitDonationInput, receiptUrl: string): Promise<Donation> {
    return donationsRepository.create(input, receiptUrl);
  },

  // pull every pending donation for the admin dashboard
  async getPendingDonations(): Promise<Donation[]> {
    const result = await donationsRepository.findAllPending();
    return result.data;
  },

  // admin approves or rejects — the repository uses atomic WHERE status = 'pending'
  // to prevent race conditions (TOCTOU)
  async reviewDonation(
    donationId: number,
    status: 'verified' | 'rejected',
    adminUserId: number,
    rejectionReason?: string
  ): Promise<Donation> {
    // verify the donation exists first for a clear error message
    const existing = await donationsRepository.findById(donationId);
    if (!existing) {
      throw new NotFoundError('Donation not found');
    }

    // the repository's WHERE status = 'pending' guard handles the race condition,
    // but we check here too for a better error message
    if (existing.status !== 'pending') {
      throw new ConflictError('Donation has already been reviewed');
    }

    return donationsRepository.updateStatus(donationId, status, adminUserId, rejectionReason);
  },

  // returns the live progress bar data for the public fundraising page
  async getDonationProgress(): Promise<DonationProgress> {
    return donationsRepository.getVerifiedTotal();
  }
};
