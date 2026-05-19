// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

// --- user ---
export type UserRole = 'student' | 'volunteer' | 'admin';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// --- cats ---
export type HealthStatus = 'healthy' | 'needs_attention' | 'injured' | 'unknown';
export type OwnershipTag = 'stray' | 'adopted' | 'campus_managed' | 'unknown';

export interface Cat {
  id: number;
  nickname: string;
  description: string;
  photoUrl: string;
  locationName: string;
  latitude: number;
  longitude: number;
  healthStatus: HealthStatus;
  ownershipTag: OwnershipTag;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

// --- emergencies ---
export type EmergencyType = 'injury' | 'sickness' | 'missing' | 'feeding_urgent' | 'danger' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface EmergencyReport {
  id: number;
  catId: number | null;
  title: string;
  description: string;
  emergencyType: EmergencyType;
  priority: Priority;
  status: EmergencyStatus;
  locationName: string;
  latitude: number;
  longitude: number;
  reportedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  cat: { id: number; nickname: string } | null;
}

// --- api responses ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// --- views / pages ---
export type AppView =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'cats'
  | 'cat-detail'
  | 'create-cat'
  | 'emergencies'
  | 'emergency-detail'
  | 'create-emergency'
  | 'profile'
  | 'donations'
  | 'create-donation'
  | 'admin-donations';

// --- form data ---
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface CreateCatFormData {
  nickname: string;
  description: string;
  photoUrl?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  healthStatus: HealthStatus;
  ownershipTag: OwnershipTag;
}

export interface CreateEmergencyFormData {
  catId?: string;
  title: string;
  description: string;
  emergencyType: EmergencyType;
  priority: Priority;
  locationName: string;
  latitude: number;
  longitude: number;
}

// --- filters ---
export interface CatFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  healthStatus?: HealthStatus | '';
}

export interface EmergencyFilters {
  page?: number;
  pageSize?: number;
  status?: EmergencyStatus | '';
  priority?: Priority | '';
}

// --- donations ---
export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

export interface DonationReceipt {
  hasReceipt: boolean;
  receiptOriginalName: string | null;
  receiptSizeBytes: number | null;
  receiptStatus: ReceiptStatus;
}

export interface Donation {
  id: number;
  donorUserId: number | null;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  message: string | null;
  studentIdMasked: string | null;
  volunteerIdMasked: string | null;
  // Admin only — not present in regular responses
  studentId?: string | null;
  volunteerId?: string | null;
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

export interface CreateDonationFormData {
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  message?: string;
  studentId?: string;
  volunteerId?: string;
}

export interface DonationFilters {
  page?: number;
  pageSize?: number;
  status?: ReceiptStatus | '';
}
