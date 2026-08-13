import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--gray-50)', textAlign: 'center', padding: '24px',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🏟️</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: '8px' }}>404</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: '24px', fontSize: '1.1rem' }}>
        Page not found. This route doesn't exist.
      </p>
      <Link to="/dashboard" className="btn btn-primary">← Back to Dashboard</Link>
    </div>
  );
}
