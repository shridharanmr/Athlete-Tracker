import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, UserCheck, Eye, EyeOff,
  AlertCircle, ArrowRight, Users, TrendingUp, CreditCard,
} from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface RegisterForm {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState<RegisterForm>({
    name: '', username: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showCPw, setShowCPw]         = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())                                   e.name = 'Full name is required.';
    if (!form.username.trim() || form.username.length < 3)  e.username = 'Min. 3 characters.';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password || form.password.length < 6)         e.password = 'Min. 6 characters.';
    if (form.password !== form.confirmPassword)             e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await authAPI.register({ username: form.username, email: form.email, password: form.password });
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-4 py-2.5 rounded-xl border ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`;

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex-col justify-between p-12">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Trophy size={26} className="text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Smart Athlete</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <UserCheck size={28} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Join as a<br />Coach today
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            Create your coach account to start managing athletes, tracking performance, and handling payments.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { icon: Users,       text: 'Create & manage your athletes' },
            { icon: TrendingUp,  text: 'Track performance over time' },
            { icon: CreditCard,  text: 'Handle fees & payments' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
              <Icon size={16} className="text-blue-200 shrink-0" />
              <span className="text-white text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <span className="text-slate-800 text-xl font-bold">Smart Athlete</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <UserCheck size={13} /> Coach Account
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h1>
              <p className="text-slate-500 text-sm mt-1">Athletes are added by you after signup</p>
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                <AlertCircle size={15} className="shrink-0" /> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* name + username */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="name">
                    Full Name
                  </label>
                  <input id="name" type="text" placeholder="John Doe" autoFocus
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass('name')} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="username">
                    Username
                  </label>
                  <input id="username" type="text" placeholder="johndoe" autoComplete="username"
                    value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className={inputClass('username')} />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
              </div>

              {/* email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input id="email" type="email" placeholder="coach@example.com" autoComplete="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass('email')} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* password + confirm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input id="password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 chars"
                      autoComplete="new-password"
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`${inputClass('password')} pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="confirmPassword">
                    Confirm
                  </label>
                  <div className="relative">
                    <input id="confirmPassword" type={showCPw ? 'text' : 'password'} placeholder="Re-enter"
                      autoComplete="new-password"
                      value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className={`${inputClass('confirmPassword')} pr-10`} />
                    <button type="button" onClick={() => setShowCPw(!showCPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 text-sm mt-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                ) : (
                  <>Create Coach Account <ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 pt-1">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Athletes receive login credentials when added by their coach.
          </p>
        </div>
      </div>
    </div>
  );
}
