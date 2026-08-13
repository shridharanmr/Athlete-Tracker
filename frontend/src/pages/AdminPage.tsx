import React, { useEffect, useState, FormEvent } from 'react';
import { UserPlus, Users, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import API from '../services/api';
import { UserRole } from '../types';
import './AdminPage.css';

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const ROLES: UserRole[] = [UserRole.Admin, UserRole.Coach, UserRole.Athlete];

const userAPI = {
  getAll: () => API.get<{ success: boolean; data: AdminUser[] }>('/users'),
  toggleActive: (id: string) =>
    API.patch<{ success: boolean; data: AdminUser }>(`/users/${id}/toggle-active`),
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateUserForm>({ username: '', email: '', password: '', role: UserRole.Coach });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    userAPI.getAll()
      .then(({ data }) => setUsers(data.data))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await authAPI.register(form);
      const { data } = await userAPI.getAll();
      setUsers(data.data);
      setShowForm(false);
      setForm({ username: '', email: '', password: '', role: UserRole.Coach });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const { data } = await userAPI.toggleActive(userId);
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.data : u)));
    } catch {
      alert('Failed to update user.');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage users and roles</p>
        </div>
      </div>

      <div className="profile-tabs" style={{ marginBottom: '20px' }}>
        <button className="tab-btn active" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={16} /> User Management
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : <><UserPlus size={16} /> Create User</>}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 className="card-title">Create New User</h3>
          {formError && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {formError}
            </div>
          )}
          <form onSubmit={handleCreateUser}>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-control" value={form.username} required
                  onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} required
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={form.password} required
                placeholder="Min. 6 characters"
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {usersLoading ? (
        <div className="loading-screen" style={{ height: '30vh' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Username</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Last Login</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                    No users found.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>
                    <span className="badge" style={{
                      background: u.isActive ? '#d1fae5' : 'var(--gray-100)',
                      color: u.isActive ? '#065f46' : 'var(--gray-500)',
                    }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleToggleActive(u._id)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
