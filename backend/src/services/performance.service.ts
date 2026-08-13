import performanceRepository from '../repositories/performance.repository';
import athleteRepository from '../repositories/athlete.repository';
import { IPerformanceRecord, PerformanceAnalysis, PerformanceTrend, UserRole } from '../types';
import { IUser } from '../types';

class PerformanceService {
  async addRecord(
    data: Partial<IPerformanceRecord>,
    user: IUser
  ): Promise<IPerformanceRecord> {
    // Coaches can only add records for their own athletes
    if (user.role === UserRole.Coach) {
      const athlete = await athleteRepository.findById(data.athlete!.toString());
      const coachId = (athlete?.coach as any)?._id || athlete?.coach;
      if (!athlete || coachId?.toString() !== user._id.toString()) {
        throw new Error('Not authorised to add records for this athlete');
      }
    }
    data.coach = user._id;
    return performanceRepository.create(data);
  }

  async getAthleteRecords(athleteId: string, user: IUser): Promise<IPerformanceRecord[]> {
    if (user.role === UserRole.Coach) {
      const athlete = await athleteRepository.findById(athleteId);
      const coachId = (athlete?.coach as any)?._id || athlete?.coach;
      if (!athlete || coachId?.toString() !== user._id.toString()) {
        throw new Error('Not authorised to view this athlete\'s records');
      }
    }
    return performanceRepository.findByAthlete(athleteId);
  }

  async analysePerformance(athleteId: string, eventName: string): Promise<PerformanceAnalysis> {
    const records = await performanceRepository.findByAthleteAndEvent(athleteId, eventName, 10);

    if (records.length < 2) {
      return {
        trend: PerformanceTrend.Insufficient,
        averageResult: 0,
        bestResult: 0,
        latestResult: 0,
        percentageChange: 0,
        totalSessions: records.length,
        suggestion: 'Add more performance records to enable trend analysis.',
      };
    }

    const numericResults = records
      .map((r) => parseFloat(r.result))
      .filter((v) => !isNaN(v));

    if (numericResults.length < 2) {
      return {
        trend: PerformanceTrend.Insufficient,
        averageResult: 0,
        bestResult: 0,
        latestResult: 0,
        percentageChange: 0,
        totalSessions: records.length,
        suggestion: 'Results must be numeric for trend analysis.',
      };
    }

    const latest = numericResults[0];
    const previous = numericResults[1];
    const best = Math.min(...numericResults); // lower = better for time-based
    const avg = numericResults.reduce((a, b) => a + b, 0) / numericResults.length;
    const pctChange = ((previous - latest) / previous) * 100; // positive = improved

    const trend = this._determineTrend(pctChange);
    const alert = this._generateAlert(trend, pctChange, latest, avg);
    const suggestion = this._generateSuggestion(trend, pctChange, records.length);

    return {
      trend,
      averageResult: parseFloat(avg.toFixed(3)),
      bestResult: best,
      latestResult: latest,
      percentageChange: parseFloat(pctChange.toFixed(2)),
      totalSessions: records.length,
      alert,
      suggestion,
    };
  }

  async getMonthlyTrend(athleteId: string, eventName: string) {
    return performanceRepository.getMonthlyAggregation(athleteId, eventName);
  }

  async getDistinctEvents(athleteId: string): Promise<string[]> {
    return performanceRepository.getDistinctEvents(athleteId);
  }

  private _determineTrend(pctChange: number): PerformanceTrend {
    if (pctChange > 2) return PerformanceTrend.Improving;
    if (pctChange < -2) return PerformanceTrend.Declining;
    return PerformanceTrend.Stable;
  }

  private _generateAlert(
    trend: PerformanceTrend,
    pctChange: number,
    latest: number,
    avg: number
  ): string | undefined {
    if (trend === PerformanceTrend.Declining && Math.abs(pctChange) > 5) {
      return `⚠️ Performance has dropped by ${Math.abs(pctChange).toFixed(1)}% compared to last session.`;
    }
    if (latest > avg * 1.1) {
      return `⚠️ Latest result is significantly below average. Consider reviewing training load.`;
    }
    return undefined;
  }

  private _generateSuggestion(
    trend: PerformanceTrend,
    pctChange: number,
    sessionCount: number
  ): string {
    if (trend === PerformanceTrend.Improving) {
      return pctChange > 10
        ? '🔥 Excellent progress! Maintain current training intensity and ensure adequate recovery.'
        : '✅ Steady improvement. Consider gradually increasing training volume.';
    }
    if (trend === PerformanceTrend.Declining) {
      return Math.abs(pctChange) > 10
        ? '🛑 Significant decline detected. Reduce training intensity and check for fatigue or injury.'
        : '⚡ Slight decline. Review technique and ensure proper nutrition and rest.';
    }
    if (sessionCount < 5) {
      return '📊 More sessions needed for accurate analysis. Keep training consistently.';
    }
    return '➡️ Performance is stable. Introduce variation in training to break the plateau.';
  }
}

export default new PerformanceService();
