import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User, GraduationCap, Medal, Shirt, FileText,
  Plus, Trash2, CheckCircle, Key, AlertCircle, PartyPopper,
} from 'lucide-react';
import { athleteAPI } from '../services/api';
import { PaymentStatus } from '../types';
import './AddEditAthletePage.css';

interface AthleteEvent { eventName: string; personalBest: string; seasonalBest: string; }
interface KitSizes { tshirt: string; lower: string; sleeveless: string; }
interface AthleteForm {
  name: string; gender: string; dateOfBirth: string; mobileNumber: string;
  email: string; address: string; fatherName: string; motherName: string;
  studentStatus: string; schoolCollegeName: string; aadharNumber: string;
  emisNumber: string; tnaaAfiId: string; height: string; weight: string;
  eventCategory: string; events: AthleteEvent[]; kitSizes: KitSizes;
  feeAmount: string; paymentStatus: PaymentStatus; notes: string;
}
interface Credentials { username: string; password: string; note: string; }
type FormErrors = Partial<Record<keyof AthleteForm, string>>;

const INITIAL_FORM: AthleteForm = {
  name: '', gender: '', dateOfBirth: '', mobileNumber: '', email: '', address: '',
  fatherName: '', motherName: '', studentStatus: '', schoolCollegeName: '',
  aadharNumber: '', emisNumber: '', tnaaAfiId: '', height: '', weight: '', eventCategory: '',
  events: [{ eventName: '', personalBest: '', seasonalBest: '' }],
  kitSizes: { tshirt: '', lower: '', sleeveless: '' },
  feeAmount: '', paymentStatus: PaymentStatus.Pending, notes: '',
};
const KIT_SIZES = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="card form-section">
    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{icon}{title}</h3>
    {children}
  </div>
);

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
    {error && <div className="form-error">{error}</div>}
  </div>
);

export default function AddEditAthletePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<AthleteForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [serverError, setServerError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    athleteAPI.getOne(id)
      .then(({ data }) => {
        const a = data.data;
        setForm({
          name: a.name || '', gender: a.gender || '',
          dateOfBirth: a.dateOfBirth ? a.dateOfBirth.slice(0, 10) : '',
          mobileNumber: a.mobileNumber || '', email: a.email || '',
          address: a.address || '', fatherName: a.fatherName || '',
          motherName: a.motherName || '', studentStatus: a.studentStatus || '',
          schoolCollegeName: a.schoolCollegeName || '', aadharNumber: a.aadharNumber || '',
          emisNumber: a.emisNumber || '', tnaaAfiId: a.tnaaAfiId || '',
          height: a.height?.toString() || '', weight: a.weight?.toString() || '',
          eventCategory: a.eventCategory || '',
          events: a.events?.length ? a.events.map((e) => ({
            eventName: e.eventName, personalBest: e.personalBest || '', seasonalBest: e.seasonalBest || '',
          })) : [{ eventName: '', personalBest: '', seasonalBest: '' }],
          kitSizes: (a as unknown as { kitSizes?: KitSizes }).kitSizes || { tshirt: '', lower: '', sleeveless: '' },
          feeAmount: a.feeAmount?.toString() || '',
          paymentStatus: a.paymentStatus as PaymentStatus,
          notes: a.notes || '',
        });
      })
      .catch(() => setServerError('Failed to load athlete data.'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = <K extends keyof AthleteForm>(field: K, value: AthleteForm[K]) =>
    setForm((f) => ({ ...f, [field]: value }));
  const setKitSize = (key: keyof KitSizes, value: string) =>
    setForm((f) => ({ ...f, kitSizes: { ...f.kitSizes, [key]: value } }));
  const setEvent = (idx: number, key: keyof AthleteEvent, value: string) =>
    setForm((f) => { const events = [...f.events]; events[idx] = { ...events[idx], [key]: value }; return { ...f, events }; });
  const addEvent = () =>
    setForm((f) => ({ ...f, events: [...f.events, { eventName: '', personalBest: '', seasonalBest: '' }] }));
  const removeEvent = (idx: number) =>
    setForm((f) => ({ ...f, events: f.events.filter((_, i) => i !== idx) }));

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.gender) e.gender = 'Gender is required.';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required.';
    if (!form.mobileNumber) e.mobileNumber = 'Mobile number is required.';
    else if (!/^[0-9]{10}$/.test(form.mobileNumber)) e.mobileNumber = 'Must be 10 digits.';
    if (form.aadharNumber && !/^[0-9]{12}$/.test(form.aadharNumber)) e.aadharNumber = 'Must be 12 digits.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true); setServerError('');
    try {
      const formData = new FormData();
      (Object.entries(form) as [keyof AthleteForm, unknown][]).forEach(([key, val]) => {
        if (key === 'events' || key === 'kitSizes') return;
        if (val !== '' && val !== null && val !== undefined) formData.append(key, String(val));
      });
      formData.append('events', JSON.stringify(form.events));
      formData.append('kitSizes', JSON.stringify(form.kitSizes));
      if (photoFile) formData.append('profilePhoto', photoFile);

      if (isEdit && id) {
        await athleteAPI.update(id, formData);
        navigate(`/athletes/${id}`);
      } else {
        const { data } = await athleteAPI.create(formData);
        if (data.credentials) {
          setCredentials(data.credentials as Credentials);
        } else {
          navigate(`/athletes/${data.data._id}`);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Failed to save athlete.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-screen" style={{ height: '60vh' }}><div className="spinner" /></div>;

  if (credentials) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="card" style={{ maxWidth: '460px', width: '90%', padding: '32px', textAlign: 'center' }}>
          <PartyPopper size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ marginBottom: '6px' }}>Athlete Created!</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '24px', fontSize: '0.9rem' }}>
            A login account has been automatically created. Share these credentials with the athlete.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '3px' }}>USERNAME</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>{credentials.username}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '3px' }}>PASSWORD</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>{credentials.password}</div>
            </div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#92400e', marginBottom: '24px', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Key size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            {credentials.note}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/athletes')}>
            Done — Go to Athletes List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-edit-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Athlete' : 'Add New Athlete'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update athlete profile information' : 'Fill in the athlete details below'}</p>
        </div>
        <Link to={isEdit ? `/athletes/${id}` : '/athletes'} className="btn btn-secondary">Cancel</Link>
      </div>

      {serverError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Section icon={<User size={18} />} title="Personal Information">
          <div className="form-row-3">
            <Field label="Full Name *" error={errors.name}>
              <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name}
                onChange={(e) => set('name', e.target.value)} placeholder="Athlete's full name" />
            </Field>
            <Field label="Gender *" error={errors.gender}>
              <select className={`form-control ${errors.gender ? 'error' : ''}`} value={form.gender}
                onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select Gender</option>
                {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Date of Birth *" error={errors.dateOfBirth}>
              <input type="date" className={`form-control ${errors.dateOfBirth ? 'error' : ''}`}
                value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Mobile Number *" error={errors.mobileNumber}>
              <input className={`form-control ${errors.mobileNumber ? 'error' : ''}`}
                value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)}
                placeholder="10-digit number" maxLength={10} />
            </Field>
            <Field label="Email Address">
              <input type="email" className="form-control" value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="athlete@example.com" />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Father's Name">
              <input className="form-control" value={form.fatherName} onChange={(e) => set('fatherName', e.target.value)} />
            </Field>
            <Field label="Mother's Name">
              <input className="form-control" value={form.motherName} onChange={(e) => set('motherName', e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <textarea className="form-control" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Profile Photo">
            <input type="file" className="form-control" accept="image/jpeg,image/png,image/webp"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPhotoFile(e.target.files?.[0] ?? null)} />
          </Field>
        </Section>

        <Section icon={<GraduationCap size={18} />} title="Academic & ID Info">
          <div className="form-row">
            <Field label="Student Status">
              <select className="form-control" value={form.studentStatus} onChange={(e) => set('studentStatus', e.target.value)}>
                <option value="">Select</option>
                {['School', 'College', 'Other'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="School / College Name">
              <input className="form-control" value={form.schoolCollegeName} onChange={(e) => set('schoolCollegeName', e.target.value)} />
            </Field>
          </div>
          <div className="form-row-3">
            <Field label="Aadhar Number" error={errors.aadharNumber}>
              <input className={`form-control ${errors.aadharNumber ? 'error' : ''}`}
                value={form.aadharNumber} onChange={(e) => set('aadharNumber', e.target.value)}
                placeholder="12-digit Aadhar" maxLength={12} />
            </Field>
            <Field label="EMIS / UMIS Number">
              <input className="form-control" value={form.emisNumber} onChange={(e) => set('emisNumber', e.target.value)} />
            </Field>
            <Field label="TNAA / AFI ID">
              <input className="form-control" value={form.tnaaAfiId} onChange={(e) => set('tnaaAfiId', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section icon={<Medal size={18} />} title="Physical & Sport Details">
          <div className="form-row-3">
            <Field label="Height (cm)">
              <input type="number" className="form-control" value={form.height} min={50}
                onChange={(e) => set('height', e.target.value)} placeholder="e.g. 175" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" className="form-control" value={form.weight} min={10}
                onChange={(e) => set('weight', e.target.value)} placeholder="e.g. 65" />
            </Field>
            <Field label="Event Category">
              <input className="form-control" value={form.eventCategory}
                onChange={(e) => set('eventCategory', e.target.value)} placeholder="e.g. Sprint" />
            </Field>
          </div>
          <div className="events-section">
            <div className="events-header">
              <label className="form-label">Events</label>
              {form.events.length < 3 && (
                <button type="button" className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={addEvent}>
                  <Plus size={14} /> Add Event
                </button>
              )}
            </div>
            {form.events.map((ev, i) => (
              <div key={i} className="event-row">
                <input className="form-control" placeholder={`Event ${i + 1} name`}
                  value={ev.eventName} onChange={(e) => setEvent(i, 'eventName', e.target.value)} />
                <input className="form-control" placeholder="Personal Best"
                  value={ev.personalBest} onChange={(e) => setEvent(i, 'personalBest', e.target.value)} />
                <input className="form-control" placeholder="Seasonal Best"
                  value={ev.seasonalBest} onChange={(e) => setEvent(i, 'seasonalBest', e.target.value)} />
                {form.events.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeEvent(i)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<Shirt size={18} />} title="Kit Sizes & Fee">
          <div className="form-row-3">
            {(['tshirt', 'lower', 'sleeveless'] as (keyof KitSizes)[]).map((k) => (
              <Field key={k} label={`${k.charAt(0).toUpperCase() + k.slice(1)} Size`}>
                <select className="form-control" value={form.kitSizes[k]} onChange={(e) => setKitSize(k, e.target.value)}>
                  {KIT_SIZES.map((s) => <option key={s} value={s}>{s || 'Not specified'}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <div className="form-row">
            <Field label="Fee Amount (₹)">
              <input type="number" className="form-control" value={form.feeAmount} min={0}
                onChange={(e) => set('feeAmount', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Payment Status">
              <select className="form-control" value={form.paymentStatus}
                onChange={(e) => set('paymentStatus', e.target.value as PaymentStatus)}>
                {Object.values(PaymentStatus).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section icon={<FileText size={18} />} title="Additional Notes">
          <textarea className="form-control" rows={3} value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any additional information about the athlete..." />
        </Section>

        <div className="form-actions">
          <Link to={isEdit ? `/athletes/${id}` : '/athletes'} className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
            {loading ? 'Saving...' : isEdit
              ? <><CheckCircle size={16} /> Update Athlete</>
              : <><Plus size={16} /> Add Athlete</>}
          </button>
        </div>
      </form>
    </div>
  );
}
