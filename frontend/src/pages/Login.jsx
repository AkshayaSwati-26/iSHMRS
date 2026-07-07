import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { KeyRound, Mail, ShieldAlert } from 'lucide-react';

const Login = () => {
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
      const loggedUser = await login(email, password);
      toast.success(`Welcome back, ${loggedUser.firstName}!`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadDemoUser = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@ishrms.com', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Doctor', email: 'doctor@ishrms.com', bg: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { label: 'Nurse', email: 'nurse@ishrms.com', bg: 'bg-sky-50 text-sky-600 border-sky-100' },
    { label: 'Receptionist', email: 'receptionist@ishrms.com', bg: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'Pharmacist', email: 'pharmacist@ishrms.com', bg: 'bg-violet-50 text-violet-600 border-violet-100' },
    { label: 'Super Admin', email: 'superadmin@ishrms.com', bg: 'bg-rose-50 text-rose-600 border-rose-100' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-600/5 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-lg glass-panel glass-panel-glow rounded-3xl p-8 relative z-10">
        {/* Header Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-inner">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">iSHRMS Ecosystem</h2>
          <p className="text-slate-500 text-sm mt-1">Smart Hospital Resource Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@ishrms.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400 text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <a href="#" onClick={() => toast.error('Demo credentials are provided below.')} className="text-xs font-bold text-indigo-600 hover:text-indigo-500">Forgot?</a>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400 text-sm transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-600/10 text-white font-semibold rounded-xl text-sm transition-all duration-200 mt-2 border border-indigo-500/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span>Sign In to iSHRMS</span>
            )}
          </button>
        </form>

        {/* Demo Accounts Board */}
        <div className="mt-8 border-t border-slate-200/60 pt-6">
          <h4 className="text-xs font-bold text-slate-500 mb-3 tracking-wider uppercase">Demo Accounts (Password: password123)</h4>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.label}
                onClick={() => loadDemoUser(acc.email)}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold border ${acc.bg} transition-all duration-200 hover:scale-[1.02] flex items-center justify-between text-left`}
              >
                <span>{acc.label}</span>
                <span className="text-[9px] opacity-60 font-normal truncate max-w-[90px]">{acc.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
