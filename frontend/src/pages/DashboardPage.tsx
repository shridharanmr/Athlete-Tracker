import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CheckCircle, AlertCircle, DollarSign, UserPlus,
  Calendar, Clock, Bell, MapPin,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { athleteAPI, paymentAPI, performanceAPI, eventAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, RevenueSummaryItem, PaymentStatus, Payment, PerformanceRecord, SportEvent } from '../types';
import './DashboardPage.css';

// ─── Shared ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  [PaymentStatus.Paid]:    '#10b981',
  [PaymentStatus.Pending]: '#f59e0b',
  [PaymentStatus.Overdue]: '#ef4444',
  [PaymentStatus.Partial]: '#8b5cf6',
  [PaymentStatus.Waived]:  '#94a3b8',
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

const StatCard = ({ icon, label, value, sub, color }: StatCardProps) => (
  <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
    <div className="stat-icon" style={{ background: color + '18' }}>{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

// ─── Athlete Dashboard ────────────────────────────────────────────────────────

function AthleteDashboard() {
  const { user } = useAuth();
  const [weeklyRecords, setWeeklyRecords] = useState<PerformanceRecord[]>([]);
  const [payments, setPayments]           = useState<Payment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [reminder, setReminder]           = useState('');

  useEffect(() => {
    Promise.all([
      performanceAPI.getMyWeekly(),
      paymentAPI.getMy(),
    ])
      .then(([perfRes, payRes]) => {
        setWeeklyRecords(perfRes.data.data);
        const pays = payRes.data.data;
        setPayments(pays);

        // Monthly reminder: show if any Pending/Overdue payment exists this month
        const now = new Date();
        const hasDue = pays.some((p) => {
          const due = new Date(p.dueDate);
          return (
            (p.status === PaymentStatus.Pending || p.status === PaymentStatus.Overdue) &&
            due.getMonth() === now.getMonth() &&
            due.getFullYear() === now.getFullYear()
          );
        });
        if (hasDue) setReminder('You have a pending fee due this month. Please contact your coach.');
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  const latestPayment = payments[0];
  const chartData = weeklyRecords.map((r) => ({
    name: r.eventName,
    result: parseFloat(r.result) || 0,
    date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Welcome, <strong>{user?.name || user?.username}</strong></p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Monthly fee reminder */}
      {reminder && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} /> {reminder}
          </div>
          <Link to="/my-fees" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Pay Now
          </Link>
        </div>
      )}

      {/* Fee status cards */}
      <div className="stats-grid">
        <StatCard
          icon={<DollarSign size={22} color="#1a56db" />}
          label="Fee Status"
          value={latestPayment?.status ?? '—'}
          color={STATUS_COLORS[latestPayment?.status ?? ''] ?? '#94a3b8'}
        />
        <StatCard
          icon={<Calendar size={22} color="#f59e0b" />}
          label="Due Date"
          value={latestPayment ? new Date(latestPayment.dueDate).toLocaleDateString('en-IN') : '—'}
          color="#f59e0b"
        />
        <StatCard
          icon={<CheckCircle size={22} color="#10b981" />}
          label="Last Paid"
          value={latestPayment?.paidAt ? new Date(latestPayment.paidAt).toLocaleDateString('en-IN') : '—'}
          color="#10b981"
        />
        <StatCard
          icon={<Clock size={22} color="#8b5cf6" />}
          label="This Week's Sessions"
          value={weeklyRecords.length}
          sub="performance entries"
          color="#8b5cf6"
        />
      </div>

      {/* Weekly performance chart */}
      <div className="card chart-card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">This Week's Performance</h3>
        <p className="card-subtitle">Results logged by your coach in the last 7 days</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="result" name="Result" radius={[6, 6, 0, 0]} fill="#1a56db" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">No performance records this week</div>
        )}
      </div>

      {/* Weekly records table */}
      <div className="card">
        <h3 className="card-title">Weekly Session Details</h3>
        <p className="card-subtitle">Entries added by your coach</p>
        {weeklyRecords.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No sessions recorded this week.</p>
        ) : (
          <div className="table-wrapper" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Event</th><th>Result</th>
                  <th>Session</th><th>Week</th><th>PB</th>
                </tr>
              </thead>
              <tbody>
                {weeklyRecords.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{r.eventName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.result} {r.unit}</td>
                    <td>{r.sessionType}</td>
                    <td>{r.week}</td>
                    <td>{r.isPersonalBest ? <span className="badge badge-paid">PB</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">Fee History</h3>
        <p className="card-subtitle">Your payment records</p>
        {payments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No payment records found.</p>
        ) : (
          <div className="table-wrapper" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr><th>Receipt</th><th>Amount</th><th>Due Date</th><th>Paid At</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{p.receiptNumber || '—'}</td>
                    <td style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td>{new Date(p.dueDate).toLocaleDateString('en-IN')}</td>
                    <td>{p.paidAt ? new Date(p.paidAt).toLocaleString('en-IN') : '—'}</td>
                    <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Coach / Admin Dashboard ──────────────────────────────────────────────────

function CoachAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [revenue, setRevenue]     = useState<RevenueSummaryItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([athleteAPI.getDashboardStats(), paymentAPI.getRevenueSummary(), eventAPI.getAll()])
      .then(([statsRes, revRes, evRes]) => {
        setStats(statsRes.data.data);
        setRevenue(revRes.data.data);
        const now = new Date();
        setUpcomingEvents(evRes.data.data.filter((e) => new Date(e.date) >= now).slice(0, 3));
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const revenueChartData = revenue.map((r) => ({ name: r._id, amount: r.total, count: r.count }));

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong>{user?.name || user?.username}</strong></p>
        </div>
        <Link to="/athletes/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserPlus size={16} /> Add Athlete
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={<Users size={22} color="#1a56db" />}       label="Total Athletes"   value={stats?.totalAthletes ?? '—'}  color="#1a56db" />
        <StatCard icon={<CheckCircle size={22} color="#10b981" />} label="Active Athletes"  value={stats?.activeAthletes ?? '—'} color="#10b981" />
        <StatCard icon={<AlertCircle size={22} color="#f59e0b" />} label="Pending Fees"     value={stats?.pendingFees ?? '—'}    color="#f59e0b" sub="athletes with dues" />
        <StatCard
          icon={<DollarSign size={22} color="#ef4444" />}
          label="Total Amount Due"
          value={stats?.totalAmountDue != null ? `₹${stats.totalAmountDue.toLocaleString('en-IN')}` : '—'}
          color="#ef4444"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card">
          <h3 className="card-title">Revenue by Payment Status</h3>
          <p className="card-subtitle">Total collected vs outstanding</p>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} />
                <Legend />
                <Bar dataKey="amount" name="Amount (₹)" radius={[6, 6, 0, 0]} fill="#1a56db" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No payment data yet</div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Payment Breakdown</h3>
          <p className="card-subtitle">Current fee collection status</p>
          <div className="payment-status-list">
            {revenue.map((r) => (
              <div key={r._id} className="payment-status-item">
                <div className="ps-left">
                  <span className="badge" style={{ background: STATUS_COLORS[r._id] + '20', color: STATUS_COLORS[r._id] }}>
                    {r._id}
                  </span>
                  <span className="ps-count">{r.count} payments</span>
                </div>
                <span className="ps-amount">₹{r.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {revenue.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No payment records</p>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Recently Added Athletes</h3>
          <Link to="/athletes" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div className="recent-athletes">
          {(stats?.recentAthletes ?? []).map((a) => (
            <Link to={`/athletes/${a._id}`} key={a._id} className="recent-athlete-item">
              <div className="ra-avatar">{a.name?.[0]?.toUpperCase()}</div>
              <div className="ra-info">
                <div className="ra-name">{a.name}</div>
                <div className="ra-category">{a.eventCategory || 'N/A'}</div>
              </div>
              <span className={`badge badge-${a.paymentStatus?.toLowerCase()}`}>{a.paymentStatus}</span>
            </Link>
          ))}
          {(!stats?.recentAthletes || stats.recentAthletes.length === 0) && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No athletes yet.{' '}
              <Link to="/athletes/add" style={{ color: 'var(--primary)' }}>Add your first athlete</Link>
            </p>
          )}
        </div>
      </div>

      {/* ── Upcoming Events ── */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Upcoming Events</h3>
          <Link to="/events" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontSize: '0.875rem' }}>No upcoming events.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingEvents.map((ev) => (
              <div key={ev._id} style={{
                padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{ev.name}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={11} /> {new Date(ev.date).toLocaleDateString('en-IN')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {ev.time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} /> {ev.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Users size={11} /> {ev.participants.length} athletes
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isAthlete } = useAuth();
  return isAthlete ? <AthleteDashboard /> : <CoachAdminDashboard />;
}
