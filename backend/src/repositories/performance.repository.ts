import PerformanceRecord from '../models/PerformanceRecord.model';
import { IPerformanceRecord } from '../types';
import { FilterQuery, Types } from 'mongoose';

class PerformanceRepository {
  async findById(id: string): Promise<IPerformanceRecord | null> {
    return PerformanceRecord.findById(id)
      .populate('athlete', 'name eventCategory')
      .populate('coach', 'username')
      .exec();
  }

  async findByAthlete(
    athleteId: string,
    limit = 50
  ): Promise<IPerformanceRecord[]> {
    return PerformanceRecord.find({ athlete: new Types.ObjectId(athleteId) })
      .sort({ date: -1 })
      .limit(limit)
      .exec();
  }

  async findByAthleteAndEvent(
    athleteId: string,
    eventName: string,
    limit = 20
  ): Promise<IPerformanceRecord[]> {
    return PerformanceRecord.find({
      athlete: new Types.ObjectId(athleteId),
      eventName,
    })
      .sort({ date: -1 })
      .limit(limit)
      .exec();
  }

  async findByAthleteAndDateRange(athleteId: string, from: Date, to: Date): Promise<IPerformanceRecord[]> {
    return PerformanceRecord.find({
      athlete: new Types.ObjectId(athleteId),
      date: { $gte: from, $lte: to },
    })
      .populate('coach', 'username')
      .sort({ date: -1 })
      .exec();
  }

  async findByCoach(coachId: string, filter: FilterQuery<IPerformanceRecord> = {}): Promise<IPerformanceRecord[]> {
    return PerformanceRecord.find({ coach: new Types.ObjectId(coachId), ...filter })
      .populate('athlete', 'name')
      .sort({ date: -1 })
      .exec();
  }

  async create(data: Partial<IPerformanceRecord>): Promise<IPerformanceRecord> {
    return PerformanceRecord.create(data);
  }

  async update(id: string, data: Partial<IPerformanceRecord>): Promise<IPerformanceRecord | null> {
    return PerformanceRecord.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<void> {
    await PerformanceRecord.findByIdAndDelete(id).exec();
  }

  // For monthly trend chart — aggregate results per month for an athlete+event
  async getMonthlyAggregation(athleteId: string, eventName: string) {
    return PerformanceRecord.aggregate([
      {
        $match: {
          athlete: new Types.ObjectId(athleteId),
          eventName,
        },
      },
      {
        $group: {
          _id: '$month',
          avgResult: { $avg: { $toDouble: '$result' } },
          count: { $sum: 1 },
          bestResult: { $min: { $toDouble: '$result' } }, // min = best for time-based events
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  // Get all distinct events for an athlete
  async getDistinctEvents(athleteId: string): Promise<string[]> {
    return PerformanceRecord.distinct('eventName', {
      athlete: new Types.ObjectId(athleteId),
    }).exec();
  }
}

export default new PerformanceRepository();
