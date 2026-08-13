import { v4 as uuidv4 } from 'uuid';
import paymentRepository from '../repositories/payment.repository';
import athleteRepository from '../repositories/athlete.repository';
import { IPayment, PaymentStatus, UserRole } from '../types';
import { IUser } from '../types';

class PaymentService {
  async getAll(user: IUser, page: number, limit: number, status?: PaymentStatus) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (user.role === UserRole.Coach) filter.recordedBy = user._id;
    return paymentRepository.findAll(filter, page, limit);
  }

  async getByAthlete(athleteId: string, user: IUser): Promise<IPayment[]> {
    if (user.role === UserRole.Coach) {
      const athlete = await athleteRepository.findById(athleteId);
      if (!athlete || athlete.coach.toString() !== user._id.toString()) {
        throw new Error('Not authorised to view payments for this athlete');
      }
    }
    return paymentRepository.findByAthlete(athleteId);
  }

  async create(data: Partial<IPayment>, user: IUser): Promise<IPayment> {
    data.recordedBy = user._id;
    data.receiptNumber = `RCP-${uuidv4().slice(0, 8).toUpperCase()}`;
    return paymentRepository.create(data);
  }

  async markAsPaid(id: string, transactionId?: string): Promise<IPayment> {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw new Error('Payment not found');

    const updated = await paymentRepository.update(id, {
      status: PaymentStatus.Paid,
      paidDate: new Date(),
      paidAt: new Date(),
      ...(transactionId && { transactionId }),
    });
    if (!updated) throw new Error('Update failed');
    return updated;
  }

  async getRevenueSummary(user: IUser) {
    return paymentRepository.getRevenueSummary(user);
  }

  async syncOverdue(): Promise<number> {
    return paymentRepository.markOverdue();
  }
}

export default new PaymentService();
