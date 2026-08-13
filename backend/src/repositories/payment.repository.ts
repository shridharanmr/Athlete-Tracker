import Payment from '../models/Payment.model';
import { IPayment, PaymentStatus } from '../types';
import { FilterQuery, Types } from 'mongoose';

class PaymentRepository {
  async findById(id: string): Promise<IPayment | null> {
    return Payment.findById(id)
      .populate('athlete', 'name mobileNumber')
      .populate('recordedBy', 'username')
      .exec();
  }

  async findAll(
    filter: FilterQuery<IPayment> = {},
    page = 1,
    limit = 10
  ): Promise<{ payments: IPayment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('athlete', 'name')
        .populate('recordedBy', 'username')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Payment.countDocuments(filter).exec(),
    ]);
    return { payments, total };
  }

  async findByAthlete(athleteId: string): Promise<IPayment[]> {
    return Payment.find({ athlete: new Types.ObjectId(athleteId) })
      .sort({ dueDate: -1 })
      .exec();
  }

  async create(data: Partial<IPayment>): Promise<IPayment> {
    return Payment.create(data);
  }

  async update(id: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<void> {
    await Payment.findByIdAndDelete(id).exec();
  }

  async getRevenueSummary(user: { role: string; _id: unknown }) {
    const matchStage: Record<string, unknown> = {};
    if (user.role === 'coach') {
      const athleteIds = await Payment.distinct('athlete', { recordedBy: user._id });
      matchStage.athlete = { $in: athleteIds };
    }
    return Payment.aggregate([
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async markOverdue(): Promise<number> {
    const result = await Payment.updateMany(
      { status: PaymentStatus.Pending, dueDate: { $lt: new Date() } },
      { $set: { status: PaymentStatus.Overdue } }
    );
    return result.modifiedCount;
  }
}

export default new PaymentRepository();
