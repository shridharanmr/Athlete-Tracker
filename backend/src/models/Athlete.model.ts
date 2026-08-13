import mongoose, { Schema } from 'mongoose';
import { IAthlete, Gender, PaymentStatus } from '../types';

const AthleteSchema = new Schema<IAthlete>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    gender: { type: String, enum: Object.values(Gender), required: true },
    dateOfBirth: { type: Date, required: true },
    mobileNumber: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Enter a valid 10-digit mobile number'],
    },
    email: { type: String, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    address: { type: String, maxlength: 500 },
    profilePhoto: { type: String, default: 'default-avatar.png' },
    fatherName: String,
    motherName: String,
    studentStatus: { type: String, enum: ['School', 'College', 'Other'] },
    schoolCollegeName: String,
    emisNumber: String,
    aadharNumber: { type: String, match: [/^[0-9]{12}$/, 'Aadhar must be 12 digits'] },
    tnaaAfiId: String,
    height: { type: Number, min: 50 },
    weight: { type: Number, min: 10 },
    eventCategory: String,
    events: [
      {
        eventName: { type: String, required: true },
        personalBest: String,
        seasonalBest: String,
      },
    ],
    kitSizes: {
      tshirt: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      lower: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      sleeveless: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    },
    feeAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
    coach: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // linked login account for the athlete
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    notes: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

AthleteSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

AthleteSchema.index({ name: 'text', eventCategory: 'text' });
AthleteSchema.index({ coach: 1 });
AthleteSchema.index({ paymentStatus: 1 });
AthleteSchema.index({ isActive: 1 });

export default mongoose.model<IAthlete>('Athlete', AthleteSchema);
