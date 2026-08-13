import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  Admin = 'admin',
  Coach = 'coach',
  Athlete = 'athlete',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Overdue = 'Overdue',
  Partial = 'Partial',
  Waived = 'Waived',
}

export enum PaymentMethod {
  Cash = 'Cash',
  UPI = 'UPI',
  BankTransfer = 'Bank Transfer',
  Cheque = 'Cheque',
  Online = 'Online',
}

export enum FeeType {
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Annual = 'Annual',
  Registration = 'Registration',
  Kit = 'Kit',
  Event = 'Event',
  Other = 'Other',
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

export enum PerformanceTrend {
  Improving = 'improving',
  Declining = 'declining',
  Stable = 'stable',
  Insufficient = 'insufficient_data',
}

// ─── User Interfaces ──────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generatePasswordResetToken(): string;
  readonly isLocked: boolean;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

// ─── Athlete Interfaces ───────────────────────────────────────────────────────

export interface IAthleteEvent {
  eventName: string;
  personalBest?: string;
  seasonalBest?: string;
}

export interface IKitSizes {
  tshirt?: string;
  lower?: string;
  sleeveless?: string;
}

export interface IAthlete extends Document {
  _id: Types.ObjectId;
  name: string;
  gender: Gender;
  dateOfBirth: Date;
  mobileNumber: string;
  email?: string;
  address?: string;
  profilePhoto: string;
  fatherName?: string;
  motherName?: string;
  studentStatus?: string;
  schoolCollegeName?: string;
  emisNumber?: string;
  aadharNumber?: string;
  tnaaAfiId?: string;
  height?: number;
  weight?: number;
  eventCategory?: string;
  events: IAthleteEvent[];
  kitSizes: IKitSizes;
  feeAmount: number;
  paymentStatus: PaymentStatus;
  coach: Types.ObjectId;
  userId?: Types.ObjectId;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  readonly age: number | null;
}

export interface AthleteCredentials {
  username: string;
  password: string;
  note: string;
}

// ─── Performance Interfaces ───────────────────────────────────────────────────

export interface IPerformanceRecord extends Document {
  _id: Types.ObjectId;
  athlete: Types.ObjectId;
  coach: Types.ObjectId;
  month: string;
  week: string;
  date: Date;
  eventName: string;
  result: string;
  unit: PerformanceUnit;
  sessionType: SessionType;
  notes?: string;
  isPersonalBest: boolean;
  isSeasonBest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceAnalysis {
  trend: PerformanceTrend;
  averageResult: number;
  bestResult: number;
  latestResult: number;
  percentageChange: number;
  alert?: string;
  suggestion?: string;
  totalSessions: number;
}

// ─── Payment Interfaces ───────────────────────────────────────────────────────

export interface IPayment extends Document {
  _id: Types.ObjectId;
  athlete: Types.ObjectId;
  recordedBy: Types.ObjectId;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  paidAt?: Date;
  reminderSentAt?: Date;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  feeType: FeeType;
  description?: string;
  receiptNumber?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Extended Express Request ─────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: IUser;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: UserRole;
  };
}
