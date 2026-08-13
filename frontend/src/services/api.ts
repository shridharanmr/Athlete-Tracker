import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  ApiResponse, PaginatedResponse, TokenPair, Athlete, PerformanceRecord,
  PerformanceAnalysis, MonthlyTrendPoint, Payment, RevenueSummaryItem, DashboardStats, SportEvent,
} from '../types';

const API: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: attach access token ────────────────────────────────────────────
API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: auto-refresh on 401 ───────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post<ApiResponse<TokenPair>>('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return API(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    API.post<ApiResponse<TokenPair>>('/auth/login', data),
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    API.post<ApiResponse<TokenPair>>('/auth/register', data),
  setup: (data: { username: string; email: string; password: string }) =>
    API.post<ApiResponse<TokenPair>>('/auth/setup', data),
  getSetupStatus: () =>
    API.get<ApiResponse<{ isFirstTimeSetup: boolean }>>('/auth/setup-status'),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get<ApiResponse<{ id: string; username: string; email: string; role: string }>>('/auth/me'),
  forgotPassword: (email: string) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    API.put<ApiResponse<TokenPair>>(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    API.put<ApiResponse<TokenPair>>('/auth/update-password', data),
};

// ─── Athletes ─────────────────────────────────────────────────────────────────
export const athleteAPI = {
  getAll: (params?: Record<string, unknown>) =>
    API.get<PaginatedResponse<Athlete>>('/athletes', { params }),
  getOne: (id: string) => API.get<ApiResponse<Athlete>>(`/athletes/${id}`),

  /**
   * GET /athletes/me — Athlete-only.
   * Returns the Athlete profile linked to the currently logged-in user.
   */
  getMyProfile: () => API.get<ApiResponse<Athlete>>('/athletes/me'),

  create: (data: FormData) =>
    API.post<ApiResponse<Athlete> & { credentials?: { username: string; password: string; note: string } }>('/athletes', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    API.put<ApiResponse<Athlete>>(`/athletes/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  delete: (id: string) => API.delete(`/athletes/${id}`),
  search: (q: string) => API.get<ApiResponse<Athlete[]>>('/athletes/search', { params: { q } }),
  getDashboardStats: () => API.get<ApiResponse<DashboardStats>>('/athletes/stats/dashboard'),
};

// ─── Performance ──────────────────────────────────────────────────────────────
export const performanceAPI = {
  getMyWeekly: () =>
    API.get<ApiResponse<PerformanceRecord[]>>('/performance/my/weekly'),
  getByAthlete: (athleteId: string) =>
    API.get<ApiResponse<PerformanceRecord[]>>(`/performance/athlete/${athleteId}`),
  getEvents: (athleteId: string) =>
    API.get<ApiResponse<string[]>>(`/performance/athlete/${athleteId}/events`),
  analyse: (athleteId: string, eventName: string) =>
    API.get<ApiResponse<PerformanceAnalysis>>(
      `/performance/athlete/${athleteId}/analyse/${encodeURIComponent(eventName)}`
    ),
  getMonthlyTrend: (athleteId: string, eventName: string) =>
    API.get<ApiResponse<MonthlyTrendPoint[]>>(
      `/performance/athlete/${athleteId}/trend/${encodeURIComponent(eventName)}`
    ),
  add: (data: Partial<PerformanceRecord>) =>
    API.post<ApiResponse<PerformanceRecord>>('/performance', data),
  delete: (id: string) => API.delete(`/performance/${id}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getAll: (params?: Record<string, unknown>) =>
    API.get<PaginatedResponse<Payment>>('/payments', { params }),
  getMy: () =>
    API.get<ApiResponse<Payment[]>>('/payments/my'),
  getByAthlete: (athleteId: string) =>
    API.get<ApiResponse<Payment[]>>(`/payments/athlete/${athleteId}`),
  create: (data: Partial<Payment>) => API.post<ApiResponse<Payment>>('/payments', data),
  markAsPaid: (id: string, transactionId?: string) =>
    API.put<ApiResponse<Payment>>(`/payments/${id}/pay`, { transactionId }),
  selfPay: (id: string) =>
    API.put<ApiResponse<Payment>>(`/payments/${id}/self-pay`),
  markReminderSent: (id: string) =>
    API.put<ApiResponse<Payment>>(`/payments/${id}/reminder`),
  getRevenueSummary: () =>
    API.get<ApiResponse<RevenueSummaryItem[]>>('/payments/summary'),
};

export default API;

// ─── Events ─────────────────────────────────────────────────────────────────
export const eventAPI = {
  getAll: () => API.get<ApiResponse<SportEvent[]>>('/events'),
  getOne: (id: string) => API.get<ApiResponse<SportEvent>>(`/events/${id}`),
  create: (data: Partial<SportEvent>) => API.post<ApiResponse<SportEvent>>('/events', data),
  update: (id: string, data: Partial<SportEvent>) => API.put<ApiResponse<SportEvent>>(`/events/${id}`, data),
  remove: (id: string) => API.delete(`/events/${id}`),
  addParticipant: (id: string, athleteId: string) =>
    API.post<ApiResponse<SportEvent>>(`/events/${id}/participants`, { athleteId }),
  removeParticipant: (id: string, athleteId: string) =>
    API.delete<ApiResponse<SportEvent>>(`/events/${id}/participants/${athleteId}`),
};
