import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { Calendar, MapPin, Clock, Users, PlusCircle, X, AlertCircle, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { eventAPI, athleteAPI } from '../services/api';
import { SportEvent, Athlete } from '../types';

interface EventForm {
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const INITIAL_FORM: EventForm = { name: '', date: '', time: '', location: '', description: '' };

export default function EventsPage() {
  const [events, setEvents]               = useState<SportEvent[]>([]);
  const [athletes, setAthletes]           = useState<Athlete[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState<EventForm>(INITIAL_FORM);
  const [formError, setFormError]         = useState('');
  const [formLoading, setFormLoading]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await eventAPI.getAll();
      setEvents(data.data);
    } catch {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!showParticipants) return;
    athleteAPI.getAll({ limit: 200 })
      .then(({ data }) => setAthletes(data.data))
      .catch(() => {});
  }, [showParticipants]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time || !form.location) {
      setFormError('Name, date, time, and location are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await eventAPI.create(form);
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchEvents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to create event.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await eventAPI.remove(id);
      fetchEvents();
    } catch {
      alert('Failed to delete event.');
    }
  };

  const handleAddParticipant = async (athleteId: string) => {
    if (!selectedEvent) return;
    try {
      const { data } = await eventAPI.addParticipant(selectedEvent._id, athleteId);
      setSelectedEvent(data.data);
      fetchEvents();
    } catch {
      alert('Failed to add participant.');
    }
  };

  const handleRemoveParticipant = async (athleteId: string) => {
    if (!selectedEvent) return;
    try {
      const { data } = await eventAPI.removeParticipant(selectedEvent._id, athleteId);
      setSelectedEvent(data.data);
      fetchEvents();
    } catch {
      alert('Failed to remove participant.');
    }
  };

  const participantIds = new Set(selectedEvent?.participants.map((p) => p._id) ?? []);
  const availableAthletes = athletes.filter((a) => !participantIds.has(a._id));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><PlusCircle size={16} /> Create Event</>}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 className="card-title">Create Event</h3>
          {formError && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={16} /> {formError}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input className="form-control" placeholder="e.g. District Championship" required
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <input className="form-control" placeholder="e.g. City Stadium" required
                  value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-control" required
                  value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input type="time" className="form-control" required
                  value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} placeholder="Optional details"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ height: '40vh' }}><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>No events yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>Create your first event to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <PlusCircle size={15} style={{ marginRight: 6 }} /> Create Event
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((ev) => (
            <div key={ev._id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {ev.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {new Date(ev.date).toLocaleDateString('en-IN')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {ev.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {ev.location}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => { setSelectedEvent(ev); setShowParticipants(true); }}
                  >
                    <Users size={13} /> Participants ({ev.participants.length})
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ev._id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {ev.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 8 }}>{ev.description}</p>
              )}
              {ev.participants.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ev.participants.slice(0, 5).map((p) => (
                    <span key={p._id} className="badge badge-coach" style={{ fontSize: '0.75rem' }}>
                      {p.name}
                    </span>
                  ))}
                  {ev.participants.length > 5 && (
                    <span className="badge" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      +{ev.participants.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Participants Modal */}
      {showParticipants && selectedEvent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }} onClick={() => setShowParticipants(false)}>
          <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Manage Participants</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowParticipants(false)}>
                <X size={14} />
              </button>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Current Participants ({selectedEvent.participants.length})
            </h4>
            {selectedEvent.participants.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>No participants yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {selectedEvent.participants.map((p) => (
                  <div key={p._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveParticipant(p._id)}>
                      <UserMinus size={13} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Add Athletes
            </h4>
            {availableAthletes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All athletes already added.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableAthletes.map((a) => (
                  <div key={a._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)',
                  }}>
                    <span style={{ fontSize: '0.875rem' }}>{a.name}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddParticipant(a._id)}>
                      <UserPlus size={13} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
