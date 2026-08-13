import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Bell, CreditCard, Clock, ArrowLeft } from 'lucide-react';
import { paymentAPI } from '../services/api';
import { Payment, PaymentStatus } from '../types';

const STATUS_COLORS: Record<string, string> = {
  [PaymentStatus.Paid]:    '#10b981',
  [PaymentStatus.Pending]: '#f59e0b',
  [PaymentStatus.Overdue]: '#ef4444',
  [PaymentStatus.Partial]: '#8b5cf6',
  [PaymentStatus.Waived]:  '#94a3b8',
};

export default function MyFeesPage() {
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [paying, setPaying]         = useState<string | null>(null);
  const [successId, setSuccessId]   = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentAPI.getMy();
      setPayments(data.data);
    } catch {
      setError('Failed to load fee records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      await paymentAPI.selfPay(id);
      setSuccessId(id);
      fetchPayments();
      setTimeout(() => setSuccessId(null), 3000);
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(null);
    }
  };

  const due = payments.filter(
    (p) => p.status === PaymentStatus.Pending || p.status === PaymentStatus.Overdue
  );
  const paid = payments.filter((p) => p.status === PaymentStatus.Paid);

  const totalDue = due.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Fees</h1>
          <p className="page-subtitle">View and pay your outstanding fees</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {successId && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle size={15} /> Payment recorded successfully!
        </div>
      )}

      {/* ── Due Payments ── */}
      {due.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', borderTop: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="card-title" style={{ marginBottom: 2 }}>
                <Bell size={15} style={{ display: 'inline', marginRight: 6, color: '#f59e0b' }} />
                Outstanding Fees
              </h3>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                {due.length} payment{due.length > 1 ? 's' : ''} pending — Total due:{' '}
                <strong style={{ color: '#ef4444' }}>₹{totalDue.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {due.map((p) => (
              <div key={p._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', borderRadius: 'var(--radius)',
                border: `1px solid ${p.status === PaymentStatus.Overdue ? '#fecaca' : '#fde68a'}`,
                background: p.status === PaymentStatus.Overdue ? '#fff5f5' : '#fffbeb',
                gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                    background: STATUS_COLORS[p.status] + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CreditCard size={20} color={STATUS_COLORS[p.status]} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.feeType} fee
                      {p.description ? ` — ${p.description}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      Due: {new Date(p.dueDate).toLocaleDateString('en-IN')}
                    </div>
                    {p.reminderSentAt && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 2 }}>
                        Reminded: {new Date(p.reminderSentAt).toLocaleDateString('en-IN')}
                      </div>
                    )}
                    <span className={`badge badge-${p.status.toLowerCase()}`} style={{ marginTop: 4 }}>
                      {p.status}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 110 }}
                    disabled={paying === p._id}
                    onClick={() => handlePay(p._id)}
                  >
                    {paying === p._id ? (
                      <><span className="btn-spinner" /> Processing...</>
                    ) : (
                      <><CheckCircle size={14} /> Pay Now</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {due.length === 0 && (
        <div className="card" style={{ marginBottom: '20px', textAlign: 'center', padding: '40px' }}>
          <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>All fees paid!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No outstanding payments at this time.</p>
        </div>
      )}

      {/* ── Payment History ── */}
      {paid.length > 0 && (
        <div className="card">
          <h3 className="card-title">Payment History</h3>
          <p className="card-subtitle">{paid.length} completed payment{paid.length > 1 ? 's' : ''}</p>
          <div className="table-wrapper" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Receipt</th><th>Amount</th><th>Fee Type</th>
                  <th>Due Date</th><th>Paid At</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.receiptNumber || '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td>{p.feeType}</td>
                    <td style={{ fontSize: '0.83rem' }}>{new Date(p.dueDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '0.83rem', color: '#10b981' }}>
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td><span className="badge badge-paid">Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
