import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Trophy, TrendingUp } from 'lucide-react';
import { athleteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Athlete } from '../types';

/**
 * MyProfilePage — rendered only for Athlete role at /profile
 * Fetches own profile via GET /athletes/me (scoped to logged-in userId on backend)
 */
export default function MyProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch only own athlete profile — /athletes/me is Athlete-only on the backend
    athleteAPI.getMyProfile()
      .then(({ data }) => setAthlete(data.data))
      .catch((err) => {
        const msg = err?.response?.data?.message || 'Failed to load profile';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={24} /> My Profile
        </h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>

      {athlete ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <img
              src={athlete.profilePhoto ? `/uploads/${athlete.profilePhoto}` : '/default-avatar.png'}
              alt={athlete.name}
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
            />
            <div>
              <h2 style={{ margin: 0 }}>{athlete.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{athlete.email || user?.email}</p>
              {athlete.eventCategory && (
                <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 12 }}>
                  {athlete.eventCategory}
                </span>
              )}
            </div>
          </div>

          {/* Personal details */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <User size={16} /> Personal Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
              <Detail label="Gender"        value={athlete.gender} />
              <Detail label="Date of Birth" value={athlete.dateOfBirth ? new Date(athlete.dateOfBirth).toLocaleDateString() : '—'} />
              <Detail label="Mobile"        value={athlete.mobileNumber} />
              <Detail label="Height"        value={athlete.height ? `${athlete.height} cm` : '—'} />
              <Detail label="Weight"        value={athlete.weight ? `${athlete.weight} kg` : '—'} />
              <Detail label="Payment"       value={athlete.paymentStatus} />
            </div>
          </section>

          {/* Events */}
          {athlete.events && athlete.events.length > 0 && (
            <section>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <Trophy size={16} /> Events
              </h3>
              <table style={{ width: '100%', marginTop: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '6px 0' }}>Event</th>
                    <th style={{ padding: '6px 0' }}>Personal Best</th>
                    <th style={{ padding: '6px 0' }}>Seasonal Best</th>
                  </tr>
                </thead>
                <tbody>
                  {athlete.events.map((ev, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0' }}>{ev.eventName}</td>
                      <td style={{ padding: '8px 0' }}>{ev.personalBest || '—'}</td>
                      <td style={{ padding: '8px 0' }}>{ev.seasonalBest || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      ) : (
        <p>No athlete profile linked to your account. Contact your coach.</p>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 500 }}>{value || '—'}</p>
    </div>
  );
}
