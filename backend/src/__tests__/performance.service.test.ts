/**
 * performance.service.test.ts
 *
 * Uses jest.spyOn on the actual singleton instances.
 */

jest.mock('../models/PerformanceRecord.model', () => ({}));
jest.mock('../models/Athlete.model', () => ({}));

import { PerformanceTrend, PerformanceUnit, SessionType } from '../types';
import performanceRepository from '../repositories/performance.repository';
import performanceService from '../services/performance.service';

// ─── Helper ───────────────────────────────────────────────────────────────────

const mockRecord = (result: string) => ({
  _id: 'rec1',
  athlete: 'ath1',
  coach: 'coach1',
  month: 'January',
  week: 'Week 1',
  date: new Date(),
  eventName: '100m Sprint',
  result,
  unit: PerformanceUnit.Seconds,
  sessionType: SessionType.Training,
  isPersonalBest: false,
  isSeasonBest: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PerformanceService.analysePerformance', () => {
  afterEach(() => jest.restoreAllMocks());

  const spy = () =>
    jest.spyOn(performanceRepository, 'findByAthleteAndEvent');

  it('returns insufficient_data when fewer than 2 records exist', async () => {
    spy().mockResolvedValue([mockRecord('12.5')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.trend).toBe(PerformanceTrend.Insufficient);
    expect(result.totalSessions).toBe(1);
    expect(result.suggestion).toContain('more performance records');
  });

  it('detects improving trend when latest result is better (lower time)', async () => {
    spy().mockResolvedValue([mockRecord('11.8'), mockRecord('12.5')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.trend).toBe(PerformanceTrend.Improving);
    expect(result.percentageChange).toBeGreaterThan(0);
    expect(result.latestResult).toBe(11.8);
    expect(result.bestResult).toBe(11.8);
  });

  it('detects declining trend when latest result is worse (higher time)', async () => {
    spy().mockResolvedValue([mockRecord('13.2'), mockRecord('12.0')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.trend).toBe(PerformanceTrend.Declining);
    expect(result.percentageChange).toBeLessThan(0);
  });

  it('detects stable trend when change is within ±2%', async () => {
    spy().mockResolvedValue([mockRecord('12.1'), mockRecord('12.0')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.trend).toBe(PerformanceTrend.Stable);
  });

  it('generates an alert when decline exceeds 5%', async () => {
    spy().mockResolvedValue([mockRecord('13.5'), mockRecord('12.0')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.alert).toBeDefined();
    expect(result.alert).toContain('dropped');
  });

  it('returns no alert for improving performance', async () => {
    spy().mockResolvedValue([mockRecord('11.5'), mockRecord('12.5')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.alert).toBeUndefined();
  });

  it('returns insufficient_data when results are non-numeric', async () => {
    spy().mockResolvedValue([mockRecord('DNF'), mockRecord('DNS')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.trend).toBe(PerformanceTrend.Insufficient);
  });

  it('calculates correct average result', async () => {
    spy().mockResolvedValue([
      mockRecord('12.0'), mockRecord('13.0'), mockRecord('11.0'),
    ] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.averageResult).toBeCloseTo(12.0, 2);
  });

  it('suggestion recommends reducing intensity on significant decline', async () => {
    spy().mockResolvedValue([mockRecord('14.0'), mockRecord('12.0')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.suggestion).toContain('Reduce training intensity');
  });

  it('suggestion recommends increasing volume on steady improvement', async () => {
    spy().mockResolvedValue([mockRecord('12.0'), mockRecord('12.5')] as never);

    const result = await performanceService.analysePerformance('ath1', '100m Sprint');

    expect(result.suggestion).toContain('training volume');
  });
});
