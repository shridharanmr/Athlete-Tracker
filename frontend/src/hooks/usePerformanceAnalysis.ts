import { useState, useEffect, useCallback } from 'react';
import { performanceAPI } from '../services/api';
import { PerformanceAnalysis, MonthlyTrendPoint } from '../types';

interface UsePerformanceAnalysisResult {
  analysis: PerformanceAnalysis | null;
  trend: MonthlyTrendPoint[];
  events: string[];
  loading: boolean;
  error: string;
  refetch: () => void;
}

export const usePerformanceAnalysis = (
  athleteId: string,
  eventName: string
): UsePerformanceAnalysisResult => {
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendPoint[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  // Fetch distinct events for the athlete
  useEffect(() => {
    if (!athleteId) return;
    performanceAPI
      .getEvents(athleteId)
      .then(({ data }) => setEvents(data.data))
      .catch(() => {});
  }, [athleteId]);

  // Fetch analysis + trend when event is selected
  useEffect(() => {
    if (!athleteId || !eventName) {
      setAnalysis(null);
      setTrend([]);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([
      performanceAPI.analyse(athleteId, eventName),
      performanceAPI.getMonthlyTrend(athleteId, eventName),
    ])
      .then(([analysisRes, trendRes]) => {
        setAnalysis(analysisRes.data.data);
        setTrend(trendRes.data.data);
      })
      .catch(() => setError('Failed to load performance analysis.'))
      .finally(() => setLoading(false));
  }, [athleteId, eventName, tick]);

  return { analysis, trend, events, loading, error, refetch };
};
