// Youssef Mostafa — CCU-S1-05 | Donations Module (Sprint 2)
// Assigned by: Loai Rafaat (Sprint Lead)
import { ConflictError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { donationsRepository } from './donations.repository.js';
import { CreateDonationInput, Donation } from './donations.types.js';

export const donationsService = {
  async submitDonation(input: CreateDonationInput): Promise<Donation> {
    // Security: block double-submit within a 60-second window
    const isDuplicate = await donationsRepository.findRecentDuplicate(
      input.userId,
      input.amount
    );
    if (isDuplicate) {
      throw new ConflictError(
        'A donation with this amount was already submitted recently. Please wait before trying again.'
      );
    }

    return donationsRepository.create(input);
  },
};
