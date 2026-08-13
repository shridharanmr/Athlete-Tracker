import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, BarChart2, Trophy, Activity, Zap, Calendar, ClipboardList, ArrowLeft, Search, User } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { athleteAPI, performanceAPI } from '../services/api';
import { usePerformanceAnalysis } from '../hooks/usePerformanceAnalysis';
import { Athlete, PerformanceRecord, PerformanceTrend } from '../types';
import './PerformancePage.css';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const TREND_CONFIG: Record<PerformanceTrend, { color: string; icon: React.ReactNode; label: string }> = {
  [PerformanceTrend.Improving]:   { color: '#10b981', icon: <TrendingUp size={24} />,  label: 'Improving' },
  [PerformanceTrend.Declining]:   { color: '#ef4444', icon: <TrendingDown size={24} />, label: 'Declining' },
  [PerformanceTrend.Stable]:      { color: '#f59e0b', icon: <Minus size={24} />,        label: 'Stable' },
  [PerformanceTrend.Insufficient]:{ color: '#94a3b8', icon: <BarChart2 size={24} />,    label: 'Insufficient Data' },
};

export default function PerformancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const athleteIdFromUrl = searchParams.get('athleteId');

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState(athleteIdFromUrl || '');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [recordsLoading, setRecordsLoading] = useState(false);

  const { analysis, trend, events, loading: analysisLoading } =
    usePerformanceAnalysis(selectedAthlete, selectedEvent);

  useEffect(() => {
    athleteAPI.getAll({ limit: 200 })
      .then(({ data }) => {
        setAthletes(data.data);
        setFilteredAthletes(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (athleteIdFromUrl) setSelectedAthlete(athleteIdFromUrl);
  }, [athleteIdFromUrl]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredAthletes(athletes);
      return;
    }
    const q = search.toLowerCase();
    setFilteredAthletes(
      athletes.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.eventCategory?.toLowerCase().includes(q) ||
        a.mobileNumber?.includes(q)
      )
    );
  }, [search, athletes]);

  useEffect(() => {
    if (!selectedAthlete) { setRecords([]); return; }
    setRecordsLoading(true);
    performanceAPI.getByAthlete(selectedAthlete)
      .then(({ data }) => {
        const all = data.data;
        setRecords(filterMonth ? all.filter((r) => r.month === filterMonth) : all);
      })
      .catch(() => {})
      .finally(() => setRecordsLoading(false));
  }, [selectedAthlete, filterMonth]);

  const handleAthleteChange = (id: string) => {
    setSelectedAthlete(id);
    setSelectedEvent('');
    setFilterMonth('');
    if (id) navigate(`/performance?athleteId=${id}`);
    else navigate('/performance');
  };

  const handleAthleteClick = (id: string) => {
    handleAthleteChange(id);
  };

  const handleBackToList = () => {
    setSelectedAthlete('');
    setSelectedEvent('');
    setFilterMonth('');
    navigate('/performance');
  };

  const trendChartData = trend.map((t) => ({ month: t._id, avg: t.avgResult, best: t.bestResult }));
  const grouped = records.reduce<Record<string, PerformanceRecord[]>>((acc, r) => {
    const key = `${r.month} — ${r.week}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const trendCfg = analysis ? TREND_CONFIG[analysis.trend] : null;

  if (!selectedAthlete) {
    return (
      <div className="performance-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Performance Tracking</h1>
            <p className="page-subtitle">Select athlete to view performance data</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search athletes by name, event, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredAthletes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <User size={48} color="#94a3b8" />
            </div>
            <h3>No Athletes Found</h3>
            <p>{search ? 'Try different search terms' : 'No athletes registered yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredAthletes.map((athlete) => (
              <div
                key={athlete._id}
                className="card"
                onClick={() => handleAthleteClick(athlete._id)}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid #e2e8f0',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a56db';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 86, 219, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1a56db 0%, #6366f1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}
                  >
                    {athlete.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                      {athlete.name}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                      {athlete.eventCategory || 'No category'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1a56db', fontSize: '14px', fontWeight: 600 }}>
                  <TrendingUp size={16} />
                  View Performance
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const selectedAthleteData = athletes.find((a) => a._id === selectedAthlete);

  return (
    <div className="performance-page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <button
              onClick={handleBackToList}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <h1 className="page-title" style={{ margin: 0 }}>
              {selectedAthleteData?.name || 'Athlete'} Performance
            </h1>
          </div>
          <p className="page-subtitle">Track, analyse, and improve performance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {events.length > 0 && (
            <div className="form-group" style={{ minWidth: '200px', marginBottom: 0 }}>
              <label className="form-label">Analyse Event</label>
              <select className="form-control" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                <option value="">— Select event —</option>
                {events.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
          )}
          <div className="form-group" style={{ minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Filter by Month</label>
            <select className="form-control" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m} value={m}>{m || 'All Months'}</option>)}
            </select>
          </div>
          <Link to={`/athletes/${selectedAthlete}`} className="btn btn-secondary btn-sm" style={{ marginBottom: '1px' }}>
            Full Profile
          </Link>
        </div>
      </div>

      {/* Smart Analysis Panel */}
      {selectedEvent && (
        <div style={{ marginBottom: '24px' }}>
          {analysisLoading ? (
            <div className="loading-screen" style={{ height: '120px' }}><div className="spinner" /></div>
          ) : analysis && trendCfg ? (
            <>
              <div className="stats-grid" style={{ marginBottom: '16px' }}>
                <div className="stat-card" style={{ borderTop: `4px solid ${trendCfg.color}` }}>
                  <div className="stat-icon" style={{ background: trendCfg.color + '18', color: trendCfg.color }}>
                    {trendCfg.icon}
                  </div>
                  <div>
                    <div className="stat-value" style={{ color: trendCfg.color }}>{trendCfg.label}</div>
                    <div className="stat-label">Performance Trend</div>
                    <div className="stat-sub">{analysis.percentageChange > 0 ? '+' : ''}{analysis.percentageChange}% vs last session</div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderTop: '4px solid #1a56db' }}>
                  <div className="stat-icon" style={{ background: '#1a56db18' }}><Trophy size={22} color="#1a56db" /></div>
                  <div>
                    <div className="stat-value">{analysis.bestResult}</div>
                    <div className="stat-label">Personal Best</div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderTop: '4px solid #8b5cf6' }}>
                  <div className="stat-icon" style={{ background: '#8b5cf618' }}><Activity size={22} color="#8b5cf6" /></div>
                  <div>
                    <div className="stat-value">{analysis.averageResult}</div>
                    <div className="stat-label">Average Result</div>
                    <div className="stat-sub">{analysis.totalSessions} sessions</div>
                  </div>
                </div>
                <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
                  <div className="stat-icon" style={{ background: '#f59e0b18' }}><Zap size={22} color="#f59e0b" /></div>
                  <div>
                    <div className="stat-value">{analysis.latestResult}</div>
                    <div className="stat-label">Latest Result</div>
                  </div>
                </div>
              </div>

              {analysis.alert && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{analysis.alert}</div>}
              {analysis.suggestion && (
                <div className="alert" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '16px', borderRadius: '8px', padding: '12px 16px' }}>
                  {analysis.suggestion}
                </div>
              )}

              {trendChartData.length > 1 && (
                <div className="card chart-card" style={{ marginBottom: '16px' }}>
                  <h3 className="card-title">Monthly Trend — {selectedEvent}</h3>
                  <p className="card-subtitle">Average and best result per month</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <ReferenceLine y={analysis.averageResult} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Avg', fontSize: 10 }} />
                      <Line type="monotone" dataKey="avg" stroke="#1a56db" strokeWidth={2} dot={{ r: 4 }} name="Avg Result" />
                      <Line type="monotone" dataKey="best" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Best Result" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {recordsLoading && <div className="loading-screen" style={{ height: '30vh' }}><div className="spinner" /></div>}

      {selectedAthlete && !recordsLoading && records.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><ClipboardList size={48} color="#94a3b8" /></div>
          <h3>No Records Found</h3>
          <p>No performance records {filterMonth ? `in ${filterMonth}` : ''} yet.</p>
        </div>
      )}

      {selectedAthlete && !recordsLoading && Object.keys(grouped).length > 0 && (
        <div className="performance-groups">
          {Object.entries(grouped).map(([period, items]) => (
            <div key={period} className="card period-card">
              <h3 className="period-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} /> {period}
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Event</th><th>Result</th><th>Session Type</th><th>PB</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 600 }}>{r.eventName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
                          {r.result}{' '}
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400 }}>
                            {r.unit !== 'other' ? r.unit : ''}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                            {r.sessionType}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {r.isPersonalBest && <span title="Personal Best"><Trophy size={14} color="#f59e0b" /></span>}
                          {r.isSeasonBest && <span title="Season Best"><Zap size={14} color="#6366f1" /></span>}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                          {new Date(r.date).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
