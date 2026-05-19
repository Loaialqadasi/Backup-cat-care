import { Pagination } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

export type CatHealthStatus = 'healthy' | 'needs_attention' | 'injured' | 'unknown';
export type CatOwnershipTag = 'stray' | 'adopted' | 'campus_managed' | 'unknown';

export interface Cat {
  id: number;
  nickname: string;
  description: string | null;
  photoUrl: string | null;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  healthStatus: CatHealthStatus;
  ownershipTag: CatOwnershipTag;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatInput {
  nickname: string;
  description?: string | null;
  photoUrl?: string | null;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  healthStatus: CatHealthStatus;
  ownershipTag: CatOwnershipTag;
  createdByUserId: number | null;
}

export interface CatListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  healthStatus?: CatHealthStatus;
}

export interface CatListResult {
  items: Cat[];
  pagination: Pagination;
}
