/**
 * pages/ForgotPasswordPage.js — replaces PHP forgetpass.php
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const { data } = await authAPI.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Forgot Password</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: '4px', fontSize: '0.9rem' }}>
            Enter your email to receive a reset link.
          </p>
        </div>

        {message && <div className="alert alert-success">✅ {message}</div>}
        {error   && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-control" placeholder="your@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: 'var(--primary)' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
