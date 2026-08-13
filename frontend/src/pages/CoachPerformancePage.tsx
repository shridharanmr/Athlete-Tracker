import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, TrendingUp, User } from 'lucide-react';
import { athleteAPI } from '../services/api';
import { Athlete } from '../types';
import './PerformancePage.css';

export default function CoachPerformancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const athleteIdFromUrl = searchParams.get('athleteId');

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    athleteAPI.getAll({ limit: 200 })
      .then(({ data }) => {
        setAthletes(data.data);
        setFilteredAthletes(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (athleteIdFromUrl) {
      navigate(`/performance?athleteId=${athleteIdFromUrl}`, { replace: true });
    }
  }, [athleteIdFromUrl, navigate]);

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

  const handleAthleteClick = (id: string) => {
    navigate(`/performance?athleteId=${id}`);
  };

  if (loading) {
    return (
      <div className="performance-page">
        <div className="loading-screen" style={{ height: '60vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

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
