import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Eye, Trash2 } from 'lucide-react';

const Alerts = () => {
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await api.get('/alerts');
      return res.data.data.alerts;
    }
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.put(`/alerts/${id}`, { status });
      return res.data.data.alert;
    },
    onSuccess: (alert) => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboardStats']);
      toast.success(`Alert marked as ${alert.status}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update alert');
    }
  });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical': 
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'High': 
        return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'Medium': 
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default: 
        return 'bg-slate-50 text-slate-500 border border-slate-200';
    }
  };

  // Motion variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ecosystem Alerts Engine</h2>
        <p className="text-sm text-slate-505 mt-1">Review active warning flags, low stock thresholds, and system errors</p>
      </motion.div>

      <div className="glass-panel border-slate-200/80 rounded-3xl overflow-hidden shadow-sm bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-xs">Loading active alerts...</div>
        ) : !alertsData || alertsData.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
            <CheckCircle className="h-10 w-10 text-emerald-500/80" />
            <span>No active alerts. System status is normal.</span>
          </div>
        ) : (
          <motion.div 
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100"
          >
            <AnimatePresence>
              {alertsData.map((alert) => (
                <motion.div 
                  key={alert.id} 
                  variants={itemVariants}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                  className="p-6 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-xl bg-slate-50 flex flex-shrink-0 items-center justify-center border ${
                      alert.severity === 'Critical' ? 'text-rose-600 border-rose-200' : 'text-amber-600 border-amber-250'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${getSeverityStyle(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-2">{alert.message}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Type: {alert.type.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alert.status === 'Active' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateAlertMutation.mutate({ id: alert.id, status: 'Acknowledged' })}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Acknowledge</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateAlertMutation.mutate({ id: alert.id, status: 'Resolved' })}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Resolve Flag</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
export { Alerts };
