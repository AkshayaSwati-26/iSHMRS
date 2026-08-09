import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { HeartPulse, ShieldCheck, UserPlus, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const PatientRegister = () => {
  const [tab, setTab] = useState('claim'); // 'claim' or 'new'
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Tab A Form: Claim UHID
  const [claimForm, setClaimForm] = useState({
    uhid: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    password: ''
  });

  // Tab B Form: New Patient
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    bloodGroup: 'O+',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  // Handle Tab A Claim Submit
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    const { uhid, dateOfBirth, phone, email, password } = claimForm;
    if (!uhid || !dateOfBirth || !phone || !email || !password) {
      toast.error('Please fill in all 5 required fields for verification');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/patient/register', {
        flow: 'claim',
        ...claimForm
      });

      if (res.data.status === 'success') {
        const { user, accessToken } = res.data.data;
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success('Patient record claimed successfully!');
        window.location.href = '/patient/dashboard';
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Verification failed. Check UHID, DOB, and Phone.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Tab B New Registration Submit
  const handleNewSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, phone, gender } = newForm;
    if (!name || !email || !password || !phone || !gender) {
      toast.error('Please fill in all mandatory fields (Name, Email, Password, Phone, Gender)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/patient/register', {
        flow: 'new',
        ...newForm
      });

      if (res.data.status === 'success') {
        const { user, accessToken, patient } = res.data.data;
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(`Account created! Your UHID is ${patient.uhid}`);
        window.location.href = '/patient/dashboard';
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 relative z-10 border border-teal-100 shadow-xl my-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <HeartPulse className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Patient Portal Registration</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Choose your registration flow below
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
          <button
            onClick={() => setTab('claim')}
            className={`py-3 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'claim'
                ? 'bg-white text-teal-800 shadow-sm border border-teal-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Tab A: Claim UHID</span>
          </button>
          
          <button
            onClick={() => setTab('new')}
            className={`py-3 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'new'
                ? 'bg-white text-teal-800 shadow-sm border border-teal-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="h-4 w-4 text-emerald-600" />
            <span>Tab B: New Patient</span>
          </button>
        </div>

        {/* TAB A: Claim Existing UHID */}
        {tab === 'claim' && (
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 text-xs text-teal-900 font-medium flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Already visited the hospital?</strong> Enter your 3 verification parameters (UHID, Date of Birth, and Phone) to securely link your existing record to your online portal.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Hospital UHID Number *</label>
              <input
                type="text"
                placeholder="e.g. UHID-20260731-12345"
                value={claimForm.uhid}
                onChange={(e) => setClaimForm({ ...claimForm, uhid: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date of Birth *</label>
                <input
                  type="date"
                  value={claimForm.dateOfBirth}
                  onChange={(e) => setClaimForm({ ...claimForm, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Registered Phone *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={claimForm.phone}
                  onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Create Email for Portal *</label>
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={claimForm.email}
                onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Create Password *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={claimForm.password}
                onChange={(e) => setClaimForm({ ...claimForm, password: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/20"
            >
              {submitting ? 'Verifying...' : 'Verify 3-Factor Match & Claim Account'}
            </button>
          </form>
        )}

        {/* TAB B: New Patient Self-Registration */}
        {tab === 'new' && (
          <form onSubmit={handleNewSubmit} className="space-y-3">
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">First time at iSHRMS?</strong> Complete this quick form to create a new Patient Profile with an auto-generated UHID and instant online portal access.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mobile Phone *</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={newForm.phone}
                  onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newForm.password}
                  onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Gender *</label>
                <select
                  value={newForm.gender}
                  onChange={(e) => setNewForm({ ...newForm, gender: e.target.value })}
                  className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date of Birth</label>
                <input
                  type="date"
                  value={newForm.dateOfBirth}
                  onChange={(e) => setNewForm({ ...newForm, dateOfBirth: e.target.value })}
                  className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Blood Group</label>
                <select
                  value={newForm.bloodGroup}
                  onChange={(e) => setNewForm({ ...newForm, bloodGroup: e.target.value })}
                  className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Residential Address</label>
              <input
                type="text"
                placeholder="City, Street, Pincode"
                value={newForm.address}
                onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 mt-2"
            >
              {submitting ? 'Creating Profile...' : 'Register & Generate UHID'}
            </button>
          </form>
        )}

        {/* Existing login link */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Link to="/patient/login" className="text-xs font-bold text-slate-600 hover:text-slate-900">
            Already have a portal login? Sign In →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PatientRegister;
