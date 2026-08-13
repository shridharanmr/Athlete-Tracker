import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Search, X, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { athleteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Athlete, PaymentStatus } from '../types';
import './AthleteListPage.css';

const GENDERS = ['', 'Male', 'Female', 'Other'];
const STATUSES: Array<'' | PaymentStatus> = ['', PaymentStatus.Paid, PaymentStatus.Pending, PaymentStatus.Overdue, PaymentStatus.Partial];
const LIMIT = 20;

export default function AthleteListPage() {
  const { isAdmin, isCoach } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'' | PaymentStatus>('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);

  const fetchAthletes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await athleteAPI.getAll({
        search: search || undefined,
        paymentStatus: paymentStatus || undefined,
        gender: gender || undefined,
        page,
        limit: LIMIT,
      });
      setAthletes(data.data);
      setTotal(data.total);
    } catch {
      setError('Failed to load athletes.');
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatus, gender, page]);

  useEffect(() => { fetchAthletes(); }, [fetchAthletes]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove athlete "${name}"? This cannot be undone.`)) return;
    try {
      await athleteAPI.delete(id);
      fetchAthletes();
    } catch {
      alert('Failed to delete athlete.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="athlete-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Athletes</h1>
          <p className="page-subtitle">{total} athlete{total !== 1 ? 's' : ''} registered</p>
        </div>
        {(isAdmin || isCoach) && (
          <Link to="/athletes/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} /> Add Athlete
          </Link>
        )}
      </div>

      <div className="card filters-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          <input
            type="search" className="form-control filter-search"
            style={{ paddingLeft: '32px' }}
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-control filter-select" value={gender}
          onChange={(e) => { setGender(e.target.value); setPage(1); }}>
          {GENDERS.map((g) => <option key={g} value={g}>{g || 'All Genders'}</option>)}
        </select>
        <select className="form-control filter-select" value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value as '' | PaymentStatus); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Payment Status'}</option>)}
        </select>
        {(search || gender || paymentStatus) && (
          <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => { setSearch(''); setGender(''); setPaymentStatus(''); setPage(1); }}>
            <X size={14} /> Clear
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
                  <th>#</th><th>Athlete</th><th>Gender</th><th>Age</th>
                  <th>Event Category</th><th>Mobile</th><th>Payment</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {athletes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                      No athletes found. {(isAdmin || isCoach) && <Link to="/athletes/add">Add one →</Link>}
                    </td>
                  </tr>
                ) : athletes.map((a, idx) => (
                  <tr key={a._id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>
                      {(page - 1) * LIMIT + idx + 1}
                    </td>
                    <td>
                      <div className="athlete-cell">
                        <div className="athlete-avatar">{a.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <Link to={`/athletes/${a._id}`} className="athlete-name-link">{a.name}</Link>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                            {a.schoolCollegeName || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{a.gender}</td>
                    <td>{a.age ?? '—'}</td>
                    <td>{a.eventCategory || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{a.mobileNumber}</td>
                    <td>
                      <span className={`badge badge-${a.paymentStatus?.toLowerCase()}`}>
                        {a.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/athletes/${a._id}`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={13} /> View</Link>
                        {(isAdmin || isCoach) && (
                          <Link to={`/athletes/${a._id}/edit`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Pencil size={13} /> Edit</Link>
                        )}
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleDelete(a._id, a.name)}>
                            <Trash2 size={13} /> Delete
                          </button>
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
