import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, Building, AlertTriangle, Check, X, Calendar } from 'lucide-react';
import api from '../utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await api.get('/alerts');
      return res.data.data.alerts;
    },
    enabled: !!user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role?.name),
    refetchInterval: 15000
  });

  // Resolve alert mutation directly from topbar pop-up
  const resolveAlertMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/alerts/${id}`, { status: 'Resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboardStats']);
      toast.success('Alert resolved successfully');
    },
    onError: (err) => {
      toast.error('Failed to resolve alert');
    }
  });

  const activeAlerts = alertsData || [];
  const activeAlertsCount = activeAlerts.length;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 bg-white/60 backdrop-blur-md z-40">
      {/* Hospital Identity */}
      <div className="flex items-center gap-2.5 text-slate-700">
        <Building className="h-5 w-5 text-indigo-600" />
        <span className="font-semibold text-sm">
          {user?.hospital?.name || 'City Central Network'}
        </span>
        <span className="h-4 w-[1px] bg-slate-200"></span>
        <span className="text-xs text-slate-405 font-mono tracking-wider">
          {user?.hospital?.code || 'HEALTH-HQ'}
        </span>
      </div>

      {/* Clock and Notifications */}
      <div className="flex items-center gap-6">
        {/* Real-time Clock */}
        <div className="flex items-center gap-2 text-slate-650 font-mono text-xs">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>
            {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-800">
            {time.toLocaleTimeString()}
          </span>
        </div>

        {/* Alerts Bell */}
        {['SUPER_ADMIN', 'ADMIN'].includes(user?.role?.name) && (
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                showNotifications 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Bell className="h-4 w-4" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse">
                  {activeAlertsCount}
                </span>
              )}
            </motion.button>

            {/* Notification Pop-up Dropdown Bar */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/5 p-4 z-50"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Ecosystem Warning Flags</span>
                      {activeAlertsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-50 text-indigo-600 rounded">
                          {activeAlertsCount} New
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Dropdown List */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {activeAlertsCount === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                        <Check className="h-6 w-6 text-emerald-500 bg-emerald-50 rounded-full p-1" />
                        <span>System status is nominal.</span>
                      </div>
                    ) : (
                      activeAlerts.slice(0, 4).map((alert) => (
                        <div 
                          key={alert.id} 
                          className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5 relative group"
                        >
                          <div className="h-6.5 w-6.5 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className="text-[8px] text-slate-400 font-semibold">
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-700 mt-1 line-clamp-2 pr-1">{alert.message}</p>
                          </div>
                          
                          {/* Quick Resolve Button inside dropdown list items */}
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            className="absolute right-2 top-2 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Resolve alert"
                          >
                            <Check className="h-3 w-3" />
                          </motion.button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/alerts');
                      }}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-600 rounded-xl text-center block transition-all cursor-pointer"
                    >
                      View All Alerts Panel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
export { Topbar };
