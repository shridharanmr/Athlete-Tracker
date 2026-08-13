import Athlete from '../models/Athlete.model';
import Payment from '../models/Payment.model';
import { UserRole } from '../types';
import { Types } from 'mongoose';

class DashboardService {
  async getStats(userId: string, role: UserRole) {
    const coachFilter = role === UserRole.Coach ? { coach: new Types.ObjectId(userId) } : {};

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalAthletes, activeAthletes, pendingFees, paidThisMonth, recentAthletes, feeAgg] =
      await Promise.all([
        Athlete.countDocuments({ isActive: true, ...coachFilter }),
        Athlete.countDocuments({ isActive: true, ...coachFilter }),
        Athlete.countDocuments({
          isActive: true,
          paymentStatus: { $in: ['Pending', 'Overdue'] },
          ...coachFilter,
        }),
        Payment.countDocuments({
          status: 'Paid',
          paidDate: { $gte: startOfMonth },
        }),
        Athlete.find({ isActive: true, ...coachFilter })
          .sort('-createdAt')
          .limit(5)
          .select('name eventCategory paymentStatus profilePhoto'),
        Payment.aggregate([
          { $match: { status: { $in: ['Pending', 'Overdue'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    return {
      totalAthletes,
      activeAthletes,
      pendingFees,
      paidThisMonth,
      totalAmountDue: (feeAgg[0]?.total as number) || 0,
      recentAthletes,
    };
  }
}

export default new DashboardService();
