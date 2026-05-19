import { NotFoundError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { buildPagination, parsePagination } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/utils.js';
import {
  CreateDonationInput,
  Donation,
  DonationListQuery,
  DonationListResult,
  DonationProgress,
  DonationStatus,
  PublicDonor
} from './donations.types.js';
import { donationsRepository } from './donations.repository.js';

const maskName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length <= 1) {
    return '*';
  }
  if (trimmed.length === 2) {
    return `${trimmed[0]}*`;
  }
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
};

export const donationsService = {
  async submitDonation(input: CreateDonationInput): Promise<Donation> {
    return donationsRepository.create(input);
  },

  async listDonations(query: DonationListQuery): Promise<DonationListResult> {
    const { page, pageSize, offset } = parsePagination(query.page, query.pageSize);
    const [items, totalItems] = await Promise.all([
      donationsRepository.list(query.status, pageSize, offset),
      donationsRepository.count(query.status)
    ]);

    return {
      items,
      pagination: buildPagination(page, pageSize, totalItems)
    };
  },

  async updateDonationStatus(id: number, status: DonationStatus, adminUserId: number): Promise<Donation> {
    const updated = await donationsRepository.updateStatus(id, status, adminUserId);
    if (!updated) {
      throw new NotFoundError('Donation submission not found');
    }
    return updated;
  },

  async getPublicProgress(goalAmount: number): Promise<DonationProgress> {
    const [totalVerifiedAmount, recentDonors] = await Promise.all([
      donationsRepository.getVerifiedTotal(),
      donationsRepository.getRecentVerifiedDonors(5)
    ]);

    const safeGoal = Math.max(1, goalAmount);
    const percentage = Math.min(100, Number(((totalVerifiedAmount / safeGoal) * 100).toFixed(2)));

    const recentVerifiedDonors: PublicDonor[] = recentDonors.map((donor) => ({
      maskedName: maskName(donor.donorName),
      amount: donor.amount,
      verifiedAt: donor.verifiedAt
    }));

    return {
      totalVerifiedAmount,
      goalAmount: safeGoal,
      percentage,
      achieved: totalVerifiedAmount >= safeGoal,
      recentVerifiedDonors
    };
  }
};
