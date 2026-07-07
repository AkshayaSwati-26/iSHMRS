import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { 
  Building2, 
  BedDouble, 
  Users, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  MapPin, 
  Phone,
  Clock,
  TrendingUp,
  BarChart3,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const CityDashboard = () => {
  const { data: cityData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['cityOverview'],
    queryFn: async () => {
      const res = await api.get('/city/overview');
      return res.data.data;
    },
    refetchInterval: 10000 // Automatically poll every 10 seconds for real-time City feed
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg"></div>
          <div className="h-10 w-10 bg-slate-200 animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 glass-panel rounded-3xl border-rose-200 text-center bg-white shadow-lg">
        <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load City-wide registry</h3>
        <p className="text-slate-500 mt-1 text-sm">{error.message || 'Verification failed. Only Super Admins can access this node.'}</p>
      </div>
    );
  }

  const { hospitals, cityWideTotals } = cityData;

  const cardStats = [
    { label: "Total Available Beds", val: cityWideTotals.totalBedsAvailable, icon: BedDouble, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', hover: 'card-hover-emerald' },
    { label: "Total Occupied Beds", val: cityWideTotals.totalBedsOccupied, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', hover: 'card-hover-indigo' },
    { label: "Active OPD Queue Load", val: cityWideTotals.totalQueueLoad, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', hover: 'card-hover-indigo' },
    { label: "Medicine Stock Shortages", val: cityWideTotals.totalShortages, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', hover: 'card-hover-rose' }
  ];

  // Map data for comparative Recharts bar chart
  const chartData = hospitals.map(h => ({
    name: h.name.split(' ').slice(0, 2).join(' '), // abbreviate name
    'Occupied Beds': h.metrics.occupiedBeds || 0,
    'OPD Queue Size': h.metrics.queueSize || 0
  }));

  // Framer Motion staggered configs
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15 } }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Multi-Hospital City Registry</h2>
          <p className="text-sm text-slate-505 mt-1">Real-time metropolitan health-grid load monitoring and resource sync</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {cardStats.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <motion.div 
              key={idx} 
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`glass-panel border ${card.bg} rounded-3xl p-6 flex items-center justify-between shadow-sm ${card.hover} cursor-pointer`}
            >
              <div>
                <p className="text-xs font-bold text-slate-505 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-2 tracking-tight">{card.val}</h3>
              </div>
              <div className={`h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center ${card.color} shadow-sm`}>
                <IconComp className="h-6 w-6" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Load Balancing Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Hospital Load Balancing Analytics</h3>
            <p className="text-[11px] text-slate-450 mt-0.5">Comparative active patient queue vs occupied bed counts</p>
          </div>
          <BarChart3 className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Bar dataKey="Occupied Beds" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="OPD Queue Size" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Hospitals Registry List */}
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Building2 className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hospital Nodes Network</h3>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          {hospitals.map((h, index) => {
            const totalBeds = (h.metrics.occupiedBeds || 0) + (h.metrics.availableBeds || 0);
            const occupancyRate = totalBeds > 0 ? Math.round((h.metrics.occupiedBeds / totalBeds) * 100) : 0;
            const rank = index + 1;

            return (
              <motion.div 
                key={h.id} 
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.01 }}
                className="glass-panel border-slate-200 hover:border-indigo-500/35 hover:shadow-lg hover:shadow-indigo-500/5 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between gap-6 bg-white shadow-sm cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-center text-indigo-650 relative shadow-sm">
                      <Building2 className="h-6 w-6" />
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white text-[9px] font-black text-white">
                        {rank}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        {h.name}
                        <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest">
                          {h.code}
                        </span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-505 mt-2 font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {h.address || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {h.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {h.metrics.emergencyAlerts > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold tracking-wider uppercase animate-pulse">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{h.metrics.emergencyAlerts} Alert Flag</span>
                    </span>
                  )}
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-505 font-bold block uppercase">Available Beds</span>
                    <span className="text-base font-black text-emerald-600 block mt-1">{h.metrics.availableBeds}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-505 font-bold block uppercase">Occupied Beds</span>
                    <span className="text-base font-black text-indigo-600 block mt-1">{h.metrics.occupiedBeds}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-505 font-bold block uppercase">OPD Queue size</span>
                    <span className="text-base font-black text-sky-600 block mt-1">{h.metrics.queueSize}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-505 font-bold block uppercase">Shortages</span>
                    <span className="text-base font-black text-rose-600 block mt-1">{h.metrics.medicineShortages}</span>
                  </div>
                </div>

                {/* Occupancy Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-505 font-bold mb-2">
                    <span>BED OCCUPANCY PROFILE</span>
                    <span className={`font-black ${occupancyRate > 80 ? 'text-rose-600' : occupancyRate > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {occupancyRate}% OCCUPIED
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        occupancyRate > 80 ? 'bg-rose-500' : occupancyRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    ></motion.div>
                  </div>
                </div>

                {/* Sync Status info */}
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-[9px] text-slate-450 font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Last Sync: {h.lastSyncedAt ? new Date(h.lastSyncedAt).toLocaleTimeString() : 'Awaiting sync...'}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    SYNC ONLINE
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default CityDashboard;
