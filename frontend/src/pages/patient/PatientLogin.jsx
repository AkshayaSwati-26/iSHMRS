import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, KeyRound, UserCheck, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const PatientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    try {
      // Patient Login request
      const res = await api.post('/auth/patient/login', { email, password });
      if (res.data.status === 'success') {
        const { user, accessToken } = res.data.data;
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(`Welcome back, ${user.firstName}!`);
        window.location.href = '/patient/dashboard';
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadDemoPatient = () => {
    setEmail('patient@ishrms.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-90 w-90 rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-lg glass-panel glass-panel-glow rounded-3xl p-8 relative z-10 border border-teal-100 shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <HeartPulse className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">iSHRMS Patient Portal</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">Manage appointments, live OPD tokens, medical records & prescriptions</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email Address or Registered Mobile</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@ishrms.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 text-slate-800 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <span onClick={() => toast.error('Use demo password: password123')} className="text-xs font-bold text-teal-600 cursor-pointer hover:underline">
                Forgot Password?
              </span>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 text-slate-800 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                <span>Signing In...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Patient Portal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadDemoPatient}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100/70 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>Load Quick Demo Credentials</span>
          </button>
        </div>

        {/* Registration CTA */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">Don't have a patient account yet?</p>
          <Link
            to="/patient/register"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700 hover:text-teal-900 underline"
          >
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Register or Claim UHID Account →</span>
          </Link>
        </div>

        {/* Staff Link */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-[11px] text-slate-400 hover:text-slate-600">
            Hospital Staff Sign In →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PatientLogin;
