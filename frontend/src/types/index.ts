// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  Admin = 'admin',
  Coach = 'coach',
  Athlete = 'athlete',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Overdue = 'Overdue',
  Partial = 'Partial',
  Waived = 'Waived',
}

export enum PerformanceTrend {
  Improving = 'improving',
  Declining = 'declining',
  Stable = 'stable',
  Insufficient = 'insufficient_data',
}

export enum SessionType {
  Training = 'Training',
  Competition = 'Competition',
  TimeTrial = 'Time Trial',
  Assessment = 'Assessment',
}

export enum PerformanceUnit {
  Seconds = 'seconds',
  Minutes = 'minutes',
  Meters = 'meters',
  Km = 'km',
  Points = 'points',
  Kg = 'kg',
  Other = 'other',
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Athlete ──────────────────────────────────────────────────────────────────

export interface AthleteEvent {
  eventName: string;
  personalBest?: string;
  seasonalBest?: string;
}

export interface Athlete {
  _id: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  age?: number;
  mobileNumber: string;
  email?: string;
  address?: string;
  profilePhoto: string;
  fatherName?: string;
  motherName?: string;
  studentStatus?: string;
  schoolCollegeName?: string;
  aadharNumber?: string;
  emisNumber?: string;
  tnaaAfiId?: string;
  height?: number;
  weight?: number;
  eventCategory?: string;
  events: AthleteEvent[];
  feeAmount: number;
  paymentStatus: PaymentStatus;
  coach: { _id: string; username: string; email: string } | string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

// ─── Performance ──────────────────────────────────────────────────────────────

export interface PerformanceRecord {
  _id: string;
  athlete: string | { _id: string; name: string };
  coach: string | { _id: string; username: string };
  month: string;
  week: string;
  date: string;
  eventName: string;
  result: string;
  unit: PerformanceUnit;
  sessionType: SessionType;
  notes?: string;
  isPersonalBest: boolean;
  isSeasonBest: boolean;
  createdAt: string;
}

export interface PerformanceAnalysis {
  trend: PerformanceTrend;
  averageResult: number;
  bestResult: number;
  latestResult: number;
  percentageChange: number;
  totalSessions: number;
  alert?: string;
  suggestion?: string;
}

export interface MonthlyTrendPoint {
  _id: string;
  avgResult: number;
  count: number;
  bestResult: number;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  _id: string;
  athlete: { _id: string; name: string; mobileNumber: string } | string;
  recordedBy: { _id: string; username: string } | string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  paidAt?: string;
  reminderSentAt?: string;
  paymentMethod: string;
  status: PaymentStatus;
  feeType: string;
  description?: string;
  receiptNumber?: string;
  transactionId?: string;
  createdAt: string;
}

export interface RevenueSummaryItem {
  _id: PaymentStatus;
  total: number;
  count: number;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface SocketNotification {
  id: string;
  type: 'performance' | 'payment' | 'alert' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

// ─── Event ─────────────────────────────────────────────────────────────────

export interface SportEvent {
  _id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  coach: string | { _id: string; username: string };
  participants: Athlete[];
  createdAt: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalAthletes: number;
  activeAthletes: number;
  pendingFees: number;
  paidThisMonth: number;
  totalAmountDue: number;
  recentAthletes: Athlete[];
}
