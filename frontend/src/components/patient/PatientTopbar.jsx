import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, LogOut, User, ShieldCheck, Bell, Sparkles } from 'lucide-react';

const PatientTopbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const patientName = user ? `${user.firstName} ${user.lastName}` : 'Patient Portal';
  const uhid = user?.patientProfile?.uhid || 'UHID-ACTIVE';

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-teal-100 shadow-sm px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/patient/dashboard')}>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HeartPulse className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-800">iSHRMS</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                PATIENT PORTAL
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Personal Health & Care Hub</p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-3">
          
          {/* UHID Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/60 text-teal-800 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>{uhid}</span>
          </div>

          {/* User Profile dropdown/info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-300">
              {user?.firstName?.[0] || 'P'}
            </div>
            <div className="hidden md:block text-left">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">{patientName}</h4>
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              logout();
              navigate('/patient/login');
            }}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        </div>

      </div>
    </header>
  );
};

export default PatientTopbar;
