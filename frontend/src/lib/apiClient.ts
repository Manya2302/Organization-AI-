// ============================================================
// Frontend API Client — SecureVault AI
// Connects React frontend to Express backend
// Location: frontend/src/lib/apiClient.ts
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Token Management ───────────────────────────────────────
let accessToken: string | null = localStorage.getItem('sv_access_token');

export const setToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem('sv_access_token', token);
  else localStorage.removeItem('sv_access_token');
};

export const getToken = () => accessToken;

// ─── Base API Fetch ──────────────────────────────────────────
interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
  const { method = 'GET', body, headers = {}, isFormData = false } = options;

  const requestHeaders: Record<string, string> = { ...headers };

  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  if (!isFormData && body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: requestHeaders,
    credentials: 'include',
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Network error' }));

  if (!response.ok) {
    const error = new Error(data.message || `API Error ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data;
};

// ─── Auth API ────────────────────────────────────────────────
export const authAPI = {
  sendOTP: (email: string, purpose: string) =>
    apiFetch('/auth/send-otp', { method: 'POST', body: { email, purpose } }),

  login: (data: { email: string; password: string; otp?: string; role?: string; organizationId?: string; employeeId?: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: data }),

  registerOrganization: (data: Record<string, unknown>) =>
    apiFetch('/auth/register-organization', { method: 'POST', body: data }),

  registerEmployee: (data: Record<string, unknown>) =>
    apiFetch('/auth/register-employee', { method: 'POST', body: data }),

  forgotPassword: (email: string) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: data }),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch('/auth/me'),
};

// ─── Documents API ───────────────────────────────────────────
export const documentAPI = {
  list: (params?: { category?: string; department?: string; search?: string; isDeleted?: boolean; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.department) query.set('department', params.department);
    if (params?.search) query.set('search', params.search);
    if (params?.isDeleted !== undefined) query.set('isDeleted', String(params.isDeleted));
    if (params?.page) query.set('page', String(params.page));
    return apiFetch(`/documents?${query.toString()}`);
  },

  get: (id: string) => apiFetch(`/documents/${id}`),

  upload: (formData: FormData) =>
    apiFetch('/documents', { method: 'POST', body: formData, isFormData: true }),

  uploadVersion: (id: string, formData: FormData) =>
    apiFetch(`/documents/${id}/version`, { method: 'POST', body: formData, isFormData: true }),

  delete: (id: string) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),

  restore: (id: string) => apiFetch(`/documents/${id}/restore`, { method: 'PATCH' }),

  getDownloadUrl: (id: string) => `${API_BASE}/documents/${id}/download`,
};

// ─── Employee API ────────────────────────────────────────────
export const employeeAPI = {
  list: (params?: { department?: string; role?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    return apiFetch(`/employees?${query.toString()}`);
  },

  invite: (data: { name: string; email: string; role: string; department?: string; designation?: string; employeeId?: string; temporaryPassword?: string }) =>
    apiFetch('/employees/invite', { method: 'POST', body: data }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/employees/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) => apiFetch(`/employees/${id}`, { method: 'DELETE' }),

  getProfile: () => apiFetch('/employees/me/profile'),

  updateProfile: (data: { name?: string; mobileNumber?: string; skills?: string[]; designation?: string }) =>
    apiFetch('/employees/me/profile', { method: 'PUT', body: data }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch('/employees/me/change-password', { method: 'POST', body: data }),
};

// ─── AI Copilot API ──────────────────────────────────────────
export const aiAPI = {
  status: () => apiFetch('/ai/status'),

  chat: (data: { message: string; sessionId?: string; chatHistory?: Array<{ role: string; content: string }> }) =>
    apiFetch('/ai/chat', { method: 'POST', body: data }),

  getSessions: () => apiFetch('/ai/sessions'),

  getSessionMessages: (sessionId: string) => apiFetch(`/ai/sessions/${sessionId}/messages`),
};

// ─── Search API ──────────────────────────────────────────────
export const searchAPI = {
  search: (q: string, options?: { type?: 'hybrid' | 'fulltext' | 'semantic'; category?: string; department?: string }) => {
    const query = new URLSearchParams({ q, ...options } as Record<string, string>);
    return apiFetch(`/search?${query.toString()}`);
  },
};

// ─── Analytics API ───────────────────────────────────────────
export const analyticsAPI = {
  overview: () => apiFetch('/analytics/overview'),
  categoryBreakdown: () => apiFetch('/analytics/category-breakdown'),
  uploadTrends: (days?: number) => apiFetch(`/analytics/upload-trends?days=${days || 7}`),
};

// ─── Audit Log API ───────────────────────────────────────────
export const auditAPI = {
  list: (params?: { action?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    return apiFetch(`/audit?${query.toString()}`);
  },
  summary: (days?: number) => apiFetch(`/audit/summary?days=${days || 30}`),
};

// ─── OCR Queue API ───────────────────────────────────────────
export const ocrAPI = {
  status: () => apiFetch('/ocr/status'),
  retry: (documentId: string) => apiFetch(`/ocr/retry/${documentId}`, { method: 'POST' }),
};

// ─── Organization API ────────────────────────────────────────
export const organizationAPI = {
  getProfile: () => apiFetch('/organizations/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    apiFetch('/organizations/profile', { method: 'PATCH', body: data }),
  getStats: () => apiFetch('/organizations/stats'),
};

export default apiFetch;
