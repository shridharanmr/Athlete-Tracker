import Athlete from '../models/Athlete.model';
import { IAthlete } from '../types';
import { FilterQuery, UpdateQuery, Types } from 'mongoose';

class AthleteRepository {
  async findById(id: string): Promise<IAthlete | null> {
    return Athlete.findById(id).populate('coach', 'username email role').exec();
  }

  /**
   * Find an athlete whose linked User account matches the given userId.
   * Used by GET /athletes/me for Athlete-role login.
   */
  async findByUserId(userId: string): Promise<IAthlete | null> {
    return Athlete.findOne({ userId: new Types.ObjectId(userId), isActive: true })
      .populate('coach', 'username email')
      .exec();
  }

  async findAll(
    filter: FilterQuery<IAthlete> = {},
    page = 1,
    limit = 10
  ): Promise<{ athletes: IAthlete[]; total: number }> {
    const skip = (page - 1) * limit;
    const [athletes, total] = await Promise.all([
      Athlete.find(filter)
        .populate('coach', 'username email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      Athlete.countDocuments(filter).exec(),
    ]);
    return { athletes, total };
  }

  async findByCoach(coachId: string): Promise<IAthlete[]> {
    return Athlete.find({ coach: new Types.ObjectId(coachId), isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async create(data: Partial<IAthlete>): Promise<IAthlete> {
    return Athlete.create(data);
  }

  async update(id: string, data: UpdateQuery<IAthlete>): Promise<IAthlete | null> {
    return Athlete.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('coach', 'username email')
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    await Athlete.findByIdAndDelete(id).exec();
  }

  async countByCoach(coachId: string): Promise<number> {
    return Athlete.countDocuments({ coach: new Types.ObjectId(coachId), isActive: true }).exec();
  }

  async search(query: string, coachId?: string): Promise<IAthlete[]> {
    const filter: FilterQuery<IAthlete> = {
      $text: { $search: query },
      isActive: true,
    };
    if (coachId) filter.coach = new Types.ObjectId(coachId);
    return Athlete.find(filter).limit(20).exec();
  }
}

export default new AthleteRepository();
