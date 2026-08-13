import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { PlusCircle, CheckCircle, AlertCircle, X, Bell, BellOff } from 'lucide-react';
import { paymentAPI, athleteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Payment, PaymentStatus, Athlete } from '../types';
import './FeeManagementPage.css';

const STATUSES: Array<'' | PaymentStatus> = [
  '', PaymentStatus.Paid, PaymentStatus.Pending, PaymentStatus.Overdue, PaymentStatus.Partial,
];

const FEE_TYPES = ['Monthly', 'Quarterly', 'Annual', 'Registration', 'Kit', 'Event', 'Other'];
const METHODS   = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online'];

interface PaymentForm {
  athlete: string;
  amount: string;
  dueDate: string;
  feeType: string;
  paymentMethod: string;
  description: string;
}

const INITIAL_FORM: PaymentForm = {
  athlete: '', amount: '', dueDate: '', feeType: 'Monthly',
  paymentMethod: 'Cash', description: '',
};

// Returns athletes whose monthly fee is pending/overdue this month
function getMonthlyReminders(payments: Payment[]): string[] {
  const now = new Date();
  const seen = new Set<string>();
  const names: string[] = [];
  payments.forEach((p) => {
    const due = new Date(p.dueDate);
    const athleteName = typeof p.athlete === 'object' ? p.athlete.name : '';
    const athleteId   = typeof p.athlete === 'object' ? p.athlete._id : '';
    if (
      p.feeType === 'Monthly' &&
      (p.status === PaymentStatus.Pending || p.status === PaymentStatus.Overdue) &&
      due.getMonth() === now.getMonth() &&
      due.getFullYear() === now.getFullYear() &&
      !seen.has(athleteId)
    ) {
      seen.add(athleteId);
      names.push(athleteName);
    }
  });
  return names;
}

export default function FeeManagementPage() {
  const { isAdmin, isCoach } = useAuth();

  const [payments, setPayments]           = useState<Payment[]>([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [statusFilter, setStatusFilter]   = useState<'' | PaymentStatus>('');
  const [page, setPage]                   = useState(1);
  const [showForm, setShowForm]           = useState(false);
  const [athletes, setAthletes]           = useState<Athlete[]>([]);
  const [form, setForm]                   = useState<PaymentForm>(INITIAL_FORM);
  const [formError, setFormError]         = useState('');
  const [formLoading, setFormLoading]     = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const limit = 15;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentAPI.getAll({ status: statusFilter || undefined, page, limit });
      setPayments(data.data);
      setTotal(data.total);
    } catch {
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    if (!showForm) return;
    athleteAPI.getAll({ limit: 200 })
      .then(({ data }) => setAthletes(data.data))
      .catch(() => {});
  }, [showForm]);

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.athlete || !form.amount || !form.dueDate) {
      setFormError('Athlete, amount, and due date are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await paymentAPI.create({
        athlete: form.athlete as unknown as Payment['athlete'],
        amount: parseFloat(form.amount),
        dueDate: new Date(form.dueDate).toISOString(),
        feeType: form.feeType as Payment['feeType'],
        paymentMethod: form.paymentMethod as Payment['paymentMethod'],
        description: form.description || undefined,
      });
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchPayments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to add payment.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await paymentAPI.markAsPaid(id);
      fetchPayments();
    } catch {
      alert('Failed to mark as paid.');
    }
  };

  const handleSendReminder = async (id: string) => {
    try {
      await paymentAPI.markReminderSent(id);
      fetchPayments();
    } catch {
      alert('Failed to send reminder.');
    }
  };

  const totalPages      = Math.ceil(total / limit);
  const athleteName     = (p: Payment) => (typeof p.athlete === 'object' ? p.athlete.name : '—');
  const reminderNames   = getMonthlyReminders(payments);
  const showReminder    = !reminderDismissed && reminderNames.length > 0;

  return (
    <div className="fee-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">{total} payment record{total !== 1 ? 's' : ''}</p>
        </div>
        {(isAdmin || isCoach) && (
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? <><X size={16} /> Cancel</> : <><PlusCircle size={16} /> Add Payment</>}
          </button>
        )}
      </div>

      {/* ── Monthly Reminder Banner ── */}
      {showReminder && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} />
            <span>
              <strong>Monthly Fee Reminder:</strong> {reminderNames.length} athlete{reminderNames.length > 1 ? 's' : ''} have unpaid fees this month
              {reminderNames.length <= 3 && ` — ${reminderNames.join(', ')}`}.
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setReminderDismissed(true)}>
            <BellOff size={13} /> Dismiss
          </button>
        </div>
      )}

      {/* ── Add Payment Form ── */}
      {showForm && (
        <div className="card fee-form-card">
          <h3 className="card-title">Add Payment Record</h3>
          {formError && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={16} /> {formError}
            </div>
          )}
          <form onSubmit={handleAddPayment}>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Athlete *</label>
                <select className="form-control" value={form.athlete} required
                  onChange={(e) => setForm({ ...form, athlete: e.target.value })}>
                  <option value="">— Select athlete —</option>
                  {athletes.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-control" min={1} placeholder="e.g. 1500"
                  value={form.amount} required
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input type="date" className="form-control" value={form.dueDate} required
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Fee Type</label>
                <select className="form-control" value={form.feeType}
                  onChange={(e) => setForm({ ...form, feeType: e.target.value })}>
                  {FEE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-control" value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" placeholder="Optional note"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Add Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="card filters-bar" style={{ marginBottom: '20px' }}>
        <select className="form-control filter-select" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as '' | PaymentStatus); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        {statusFilter && (
          <button className="btn btn-secondary btn-sm"
            onClick={() => { setStatusFilter(''); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ height: '40vh' }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Receipt</th><th>Athlete</th><th>Amount</th>
                  <th>Fee Type</th><th>Due Date</th><th>Paid At</th>
                  <th>Method</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No payment records found.{' '}
                      {(isAdmin || isCoach) && (
                        <button className="btn btn-primary btn-sm" style={{ marginLeft: '8px' }}
                          onClick={() => setShowForm(true)}>
                          Add first payment
                        </button>
                      )}
                    </td>
                  </tr>
                ) : payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.receiptNumber || '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{athleteName(p)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td>{p.feeType}</td>
                    <td style={{ fontSize: '0.83rem' }}>
                      {new Date(p.dueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.83rem', color: p.paidAt ? 'var(--success)' : 'var(--text-muted)' }}>
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td>{p.paymentMethod}</td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(isAdmin || isCoach) && p.status !== PaymentStatus.Paid && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleMarkPaid(p._id)}
                            >
                              <CheckCircle size={13} /> Mark Paid
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                              title={p.reminderSentAt ? `Last reminded: ${new Date(p.reminderSentAt).toLocaleDateString('en-IN')}` : 'Send reminder'}
                              onClick={() => handleSendReminder(p._id)}
                            >
                              <Bell size={13} />
                              {p.reminderSentAt ? 'Re-remind' : 'Remind'}
                            </button>
                          </>
                        )}
                        {p.status === PaymentStatus.Paid && (
                          <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> Paid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                ← Prev
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
