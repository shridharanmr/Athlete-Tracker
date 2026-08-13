import mongoose, { Schema } from 'mongoose';
import { IPayment, PaymentStatus, PaymentMethod, FeeType } from '../types';

const PaymentSchema = new Schema<IPayment>(
  {
    athlete: { type: Schema.Types.ObjectId, ref: 'Athlete', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    paidDate: Date,
    paidAt: Date,
    reminderSentAt: Date,
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.Cash,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
    feeType: {
      type: String,
      enum: Object.values(FeeType),
      default: FeeType.Monthly,
    },
    description: String,
    receiptNumber: { type: String, unique: true, sparse: true },
    transactionId: String,
  },
  { timestamps: true }
);

PaymentSchema.pre('save', function (next) {
  if (this.status === PaymentStatus.Pending && this.dueDate < new Date()) {
    this.status = PaymentStatus.Overdue;
  }
  next();
});

PaymentSchema.index({ athlete: 1, status: 1 });
PaymentSchema.index({ dueDate: 1 });
PaymentSchema.index({ recordedBy: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
