import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import PatientTopbar from './PatientTopbar';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  Pill,
  Activity,
  FileText,
  BedDouble,
  MessageSquareHeart,
  UserCheck,
  FolderOpen
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { name: 'Health Timeline', path: '/patient/timeline', icon: Clock },
  { name: 'Appointments', path: '/patient/appointments', icon: Calendar },
  { name: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
  { name: 'Vitals & Symptoms', path: '/patient/vitals', icon: Activity },
  { name: 'Medical Vault', path: '/patient/documents', icon: FolderOpen },
  { name: 'Admission', path: '/patient/admission', icon: BedDouble },
  { name: 'Feedback', path: '/patient/feedback', icon: MessageSquareHeart },
];

const PatientLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col relative overflow-x-hidden">
      {/* Soft Teal background glows */}
      <div className="fixed top-[-15%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-teal-500/5 blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-15%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <PatientTopbar />

      {/* Navigation Sub-Bar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-[65px] z-20 shadow-xs px-4 md:px-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
                  isActive
                    ? 'text-teal-700 bg-teal-50 border border-teal-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activePatientTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>© 2026 iSHRMS Smart Hospital System · Integrated Patient Health Portal</p>
      </footer>
    </div>
  );
};

export default PatientLayout;
