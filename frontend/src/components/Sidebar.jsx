import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GitCommit,
  BedDouble,
  Pill,
  AlertCircle,
  FileBarChart,
  LogOut,
  UserCheck,
  Calendar
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      path: user?.role?.name === 'SUPER_ADMIN' ? '/city-dashboard' : '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST']
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR']
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR']
    },
    {
      name: 'OPD Queue',
      path: '/opd',
      icon: GitCommit,
      roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']
    },
    {
      name: 'Bed Board',
      path: '/beds',
      icon: BedDouble,
      roles: ['SUPER_ADMIN', 'ADMIN', 'NURSE', 'RECEPTIONIST']
    },
    {
      name: 'Pharmacy',
      path: '/inventory',
      icon: Pill,
      roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST']
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: AlertCircle,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileBarChart,
      roles: ['SUPER_ADMIN', 'ADMIN']
    }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role?.name));

  return (
    <aside className="w-64 glass-panel border-r border-slate-200/80 flex flex-col h-screen sticky top-0 bg-white/70">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-200/60 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 text-indigo-600">
          <span className="font-extrabold text-lg">i</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">iSHRMS</h1>
          <p className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">Smart Health</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto z-10 relative">
        {filteredMenu.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-md shadow-indigo-600/15 border border-indigo-500/20"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                  <IconComponent className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 truncate">{user.firstName} {user.lastName}</h4>
            <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 tracking-wider uppercase">
              {user.role?.name.replace('_', ' ')}
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all duration-205 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout Session</span>
        </motion.button>
      </div>
    </aside>
  );
};

export default Sidebar;
