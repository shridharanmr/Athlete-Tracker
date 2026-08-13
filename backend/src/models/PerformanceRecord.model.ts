import mongoose, { Schema } from 'mongoose';
import { IPerformanceRecord, PerformanceUnit, SessionType } from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PerformanceRecordSchema = new Schema<IPerformanceRecord>(
  {
    athlete: { type: Schema.Types.ObjectId, ref: 'Athlete', required: true },
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true, enum: MONTHS },
    week: { type: String, required: true, enum: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'] },
    date: { type: Date, default: Date.now },
    eventName: { type: String, required: true, trim: true },
    result: { type: String, required: true },
    unit: { type: String, enum: Object.values(PerformanceUnit), default: PerformanceUnit.Seconds },
    sessionType: {
      type: String,
      enum: Object.values(SessionType),
      default: SessionType.Training,
    },
    notes: String,
    isPersonalBest: { type: Boolean, default: false },
    isSeasonBest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PerformanceRecordSchema.index({ athlete: 1, month: 1, week: 1 });
PerformanceRecordSchema.index({ athlete: 1, date: -1 });
PerformanceRecordSchema.index({ athlete: 1, eventName: 1, date: -1 });

export default mongoose.model<IPerformanceRecord>('PerformanceRecord', PerformanceRecordSchema);
