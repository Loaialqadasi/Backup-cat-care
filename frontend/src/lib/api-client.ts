// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import type {
  User,
  Cat,
  EmergencyReport,
  ApiResponse,
  PaginatedResponse,
  LoginFormData,
  RegisterFormData,
  CreateCatFormData,
  CreateEmergencyFormData,
  CatFilters,
  EmergencyFilters,
  EmergencyStatus,
  Donation,
  CreateDonationFormData,
  DonationFilters,
} from './types';
import { demoUser, demoCats, demoEmergencies } from './mock-data';

const API_BASE = 'https://catcare-backend.onrender.com/api';
const BACKEND_AVAILABLE = process.env.NEXT_PUBLIC_BACKEND_AVAILABLE !== 'false';

const UTM_EMAIL_DOMAINS = ['@utm.my', '@graduate.utm.my'];

function isUtmEmail(email: string): boolean {
  return UTM_EMAIL_DOMAINS.some((domain) => email.endsWith(domain));
}

// fake a small delay so the UI shows loading states
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- auth ---
export async function login(data: LoginFormData): Promise<{ user: User; token: string }> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Login failed');
    return json.data;
  }

  // using demo data
  await delay(800);
  if (!isUtmEmail(data.email)) {
    throw new Error('Please use a valid UTM email (e.g. your.name@utm.my or your.name@graduate.utm.my)');
  }
  if (data.email === demoUser.email && data.password === 'password123') {
    return { user: demoUser, token: 'mock-jwt-token-xyz' };
  }
  // in demo mode we just let anyone in with a valid UTM email
  return {
    user: { ...demoUser, email: data.email },
    token: 'mock-jwt-token-xyz',
  };
}

export async function register(data: RegisterFormData): Promise<{ user: User; token: string }> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Registration failed');
    return json.data;
  }

  // using demo data
  await delay(1000);
  if (!isUtmEmail(data.email)) {
    throw new Error('Please use a valid UTM email (e.g. your.name@utm.my or your.name@graduate.utm.my)');
  }
  const newUser: User = {
    id: Math.floor(Date.now() / 1000),
    fullName: data.fullName,
    email: data.email,
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { user: newUser, token: 'mock-jwt-token-xyz' };
}

export async function getMe(token: string): Promise<User> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to get user');
    return json.data;
  }

  // using demo data
  await delay(300);
  return demoUser;
}

// --- cats ---
export async function fetchCats(
  filters: CatFilters = {},
  _token?: string
): Promise<PaginatedResponse<Cat>> {
  const { page = 1, pageSize = 10, search = '', healthStatus = '' } = filters;

  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set('search', search);
    if (healthStatus) params.set('healthStatus', healthStatus);
    const res = await fetch(`${API_BASE}/cats?${params}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch cats');
    return json.data;
  }

  // using demo data
  await delay(600);

  let filtered = [...demoCats];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.nickname.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.locationName.toLowerCase().includes(q)
    );
  }

  if (healthStatus) {
    filtered = filtered.filter((c) => c.healthStatus === healthStatus);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, pagination: { page, pageSize, totalItems, totalPages } };
}

export async function fetchCatById(id: number, _token?: string): Promise<Cat> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/cats/${id}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch cat');
    return json.data;
  }

  // using demo data
  await delay(400);
  const cat = demoCats.find((c) => c.id === Number(id));
  if (!cat) throw new Error('Cat not found');
  return cat;
}

export async function createCat(
  data: CreateCatFormData,
  _token?: string
): Promise<Cat> {
  if (BACKEND_AVAILABLE) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    const res = await fetch(`${API_BASE}/cats`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${_token}` },
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to create cat');
    return json.data;
  }

  // using demo data
  await delay(1000);
  const newCat: Cat = {
    id: Math.floor(Date.now() / 1000),
    nickname: data.nickname,
    description: data.description,
    photoUrl: data.photoUrl || 'https://placecats.com/millie/400/300',
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    healthStatus: data.healthStatus,
    ownershipTag: data.ownershipTag,
    createdByUserId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoCats.unshift(newCat);
  return newCat;
}

// --- emergencies ---
export async function fetchEmergencies(
  filters: EmergencyFilters = {},
  _token?: string
): Promise<PaginatedResponse<EmergencyReport>> {
  const { page = 1, pageSize = 10, status = '', priority = '' } = filters;

  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    const res = await fetch(`${API_BASE}/emergencies?${params}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch emergencies');
    return json.data;
  }

  // using demo data
  await delay(600);

  let filtered = [...demoEmergencies];

  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }

  if (priority) {
    filtered = filtered.filter((e) => e.priority === priority);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, pagination: { page, pageSize, totalItems, totalPages } };
}

export async function fetchEmergencyById(
  id: number,
  _token?: string
): Promise<EmergencyReport> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies/${id}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch emergency');
    return json.data;
  }

  // using demo data
  await delay(400);
  const emergency = demoEmergencies.find((e) => e.id === Number(id));
  if (!emergency) throw new Error('Emergency report not found');
  return emergency;
}

export async function fetchPriorityFeed(_token?: string): Promise<EmergencyReport[]> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies/priority-feed`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch priority feed');
    return json.data;
  }

  // using demo data
  await delay(500);
  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return demoEmergencies
    .filter((e) => e.status !== 'resolved' && e.status !== 'cancelled')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export async function createEmergency(
  data: CreateEmergencyFormData,
  _token?: string
): Promise<EmergencyReport> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to create emergency');
    return json.data;
  }

  // using demo data
  await delay(1000);
  const cat = data.catId ? demoCats.find((c) => c.id === Number(data.catId)) : null;
  const newEmergency: EmergencyReport = {
    id: Math.floor(Date.now() / 1000),
    catId: data.catId || null,
    title: data.title,
    description: data.description,
    emergencyType: data.emergencyType,
    priority: data.priority,
    status: 'open',
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    reportedByUserId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    cat: cat ? { id: cat.id, nickname: cat.nickname } : null,
  };
  demoEmergencies.unshift(newEmergency);
  return newEmergency;
}

export async function updateEmergencyStatus(
  id: string,
  status: EmergencyStatus,
  _token?: string
): Promise<EmergencyReport> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_token}`,
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to update status');
    return json.data;
  }

  // using demo data
  await delay(500);
  const emergency = demoEmergencies.find((e) => e.id === Number(id));
  if (!emergency) throw new Error('Emergency not found');
  emergency.status = status;
  emergency.updatedAt = new Date().toISOString();
  if (status === 'resolved' || status === 'cancelled') {
    emergency.resolvedAt = new Date().toISOString();
  }
  return { ...emergency };
}

// --- donations ---

export async function createDonation(
  data: CreateDonationFormData,
  receiptFile: File | null,
  token?: string
): Promise<Donation> {
  if (BACKEND_AVAILABLE) {
    // Use FormData because we're sending a file alongside JSON fields
    const form = new FormData();
    form.append('donorName', data.donorName);
    form.append('donorEmail', data.donorEmail);
    form.append('amount', String(data.amount));
    form.append('currency', data.currency || 'MYR');
    if (data.message)     form.append('message', data.message);
    if (data.studentId)   form.append('studentId', data.studentId);
    if (data.volunteerId) form.append('volunteerId', data.volunteerId);
    if (receiptFile)      form.append('receipt', receiptFile);

    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to submit donation');
    return json.data;
  }

  // Demo fallback
  await delay(1200);
  return {
    id: Math.floor(Date.now() / 1000),
    donorUserId: null,
    donorName: data.donorName,
    donorEmail: data.donorEmail,
    amount: data.amount,
    currency: data.currency || 'MYR',
    message: data.message || null,
    studentIdMasked: data.studentId ? `${data.studentId.slice(0,3)}****${data.studentId.slice(-2)}` : null,
    volunteerIdMasked: data.volunteerId ? `${data.volunteerId.slice(0,3)}****${data.volunteerId.slice(-2)}` : null,
    hasReceipt: !!receiptFile,
    receiptOriginalName: receiptFile?.name || null,
    receiptSizeBytes: receiptFile?.size || null,
    receiptStatus: 'pending' as const,
    adminNotes: null,
    reviewedByUserId: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchDonations(
  filters: DonationFilters = {},
  token?: string
): Promise<PaginatedResponse<Donation>> {
  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams();
    if (filters.page)     params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.status)   params.set('status', filters.status);

    const res = await fetch(`${API_BASE}/donations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to load donations');
    return json.data;
  }

  await delay(600);
  return { items: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
}

export async function reviewDonationReceipt(
  donationId: string,
  status: 'approved' | 'rejected',
  adminNotes: string,
  token?: string
): Promise<Donation> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/donations/${donationId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminNotes }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to review receipt');
    return json.data;
  }

  await delay(700);
  throw new Error('Review requires the real backend to be running');
}

// Admin: search donations by student ID using hash-based lookup (TG-1 compliant)
// The backend hashes the query before comparing — the plaintext never hits the DB.
export async function searchDonationsByStudentId(
  studentId: string,
  token?: string
): Promise<Donation[]> {
  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({ studentId });
    const res = await fetch(`${API_BASE}/donations/search/student?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Search failed');
    return json.data;
  }

  await delay(400);
  return []; // no mock data for admin search
}

// Admin: search donations by volunteer ID using hash-based lookup (TG-1 compliant)
export async function searchDonationsByVolunteerId(
  volunteerId: string,
  token?: string
): Promise<Donation[]> {
  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({ volunteerId });
    const res = await fetch(`${API_BASE}/donations/search/volunteer?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Search failed');
    return json.data;
  }

  await delay(400);
  return []; // no mock data for admin search
}

