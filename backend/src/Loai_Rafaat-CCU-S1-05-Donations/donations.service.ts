import { NotFoundError, AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { donationsRepository } from './donations.repository.js';
import { encrypt, hashForSearch } from './encryption.util.js';
import { deleteUploadedFile } from './receipt-upload.middleware.js';
import { CreateDonationInput, ReviewReceiptInput, Donation, DonationAdminView } from './donations.types.js';
import { Pagination } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

export const donationsService = {

  // Create a donation record — encrypts sensitive IDs before any database interaction
  async create(
    input: CreateDonationInput,
    donorUserId: number | null,
    receiptFile?: Express.Multer.File
  ): Promise<Donation> {
    // Encrypt the IDs right here before they go anywhere near the DB
    // We also store a searchable HMAC hash alongside each encrypted value
    const studentIdEncrypted  = input.studentId  ? encrypt(input.studentId)           : undefined;
    const volunteerIdEncrypted = input.volunteerId ? encrypt(input.volunteerId)        : undefined;
    const studentIdHash        = input.studentId  ? hashForSearch(input.studentId)    : undefined;
    const volunteerIdHash      = input.volunteerId ? hashForSearch(input.volunteerId) : undefined;

    try {
      const donation = await donationsRepository.create({
        donorUserId,
        donorName:  input.donorName,
        donorEmail: input.donorEmail,
        amount:     input.amount,
        currency:   input.currency,
        message:    input.message,
        studentIdEncrypted,
        volunteerIdEncrypted,
        studentIdHash,
        volunteerIdHash,
        receiptFilePath:    receiptFile?.path,
        receiptOriginalName: receiptFile?.originalname,
        receiptMimeType:    receiptFile?.mimetype,
        receiptSizeBytes:   receiptFile?.size,
      });
      return donation;
    } catch (error) {
      // If the DB write fails and we already saved a file, clean it up so we don't orphan files
      if (receiptFile?.path) {
        deleteUploadedFile(receiptFile.path);
      }
      throw error;
    }
  },

  // Upload or replace the receipt file on an existing donation
  async uploadReceipt(
    donationId: number,
    requestingUserId: number,
    file: Express.Multer.File
  ): Promise<Donation> {
    const existing = await donationsRepository.findById(donationId);
    if (!existing) {
      deleteUploadedFile(file.path);
      throw new NotFoundError('Donation not found');
    }

    // Donors can only upload to their own records; admins can attach to anything
    if (existing.donorUserId !== requestingUserId) {
      deleteUploadedFile(file.path);
      throw new AuthorizationError('You can only upload receipts to your own donations');
    }

    // If there was already a file, delete the old one before saving the new one
    // H-4: use the admin view to get the internal file path
    const existingAdmin = await donationsRepository.findByIdAdmin(donationId);
    if (existingAdmin?.receiptFilePath) {
      deleteUploadedFile(existingAdmin.receiptFilePath);
    }

    const updated = await donationsRepository.attachReceipt(donationId, {
      filePath:     file.path,
      originalName: file.originalname,
      mimeType:     file.mimetype,
      sizeBytes:    file.size,
    });

    if (!updated) throw new NotFoundError('Donation not found after update');
    return updated;
  },

  async getById(id: number): Promise<Donation> {
    const donation = await donationsRepository.findById(id);
    if (!donation) throw new NotFoundError('Donation not found');
    return donation;
  },

  // Admin version — includes decrypted IDs
  async getByIdAdmin(id: number): Promise<DonationAdminView> {
    const donation = await donationsRepository.findByIdAdmin(id);
    if (!donation) throw new NotFoundError('Donation not found');
    return donation;
  },

  async list(options: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'approved' | 'rejected';
    search?: string;
    donorUserId?: number; // H-1: restrict to the requesting user's donations
  }): Promise<{ items: Donation[]; pagination: Pagination }> {
    return donationsRepository.list(options);
  },

  // Admin list: includes decrypted IDs in every item
  async listAdmin(options: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'approved' | 'rejected';
    search?: string;
  }): Promise<{ items: DonationAdminView[]; pagination: Pagination }> {
    return donationsRepository.listAdmin(options);
  },

  // Admin reviews (approves or rejects) a receipt
  async reviewReceipt(
    donationId: number,
    adminUserId: number,
    input: ReviewReceiptInput
  ): Promise<Donation> {
    const existing = await donationsRepository.findById(donationId);
    if (!existing) throw new NotFoundError('Donation not found');

    if (!existing.hasReceipt) {
      throw new NotFoundError('No receipt has been uploaded for this donation yet');
    }

    const updated = await donationsRepository.reviewReceipt(
      donationId,
      adminUserId,
      input.status,
      input.adminNotes
    );
    if (!updated) throw new NotFoundError('Donation not found after update');
    return updated;
  },

  // Search by student or volunteer ID using the stored hash — never decrypt in bulk
  async searchByStudentId(studentId: string): Promise<Donation[]> {
    const hash = hashForSearch(studentId);
    return donationsRepository.findByStudentIdHash(hash);
  },

  async searchByVolunteerId(volunteerId: string): Promise<Donation[]> {
    const hash = hashForSearch(volunteerId);
    return donationsRepository.findByVolunteerIdHash(hash);
  },
};
