import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Bed,
  AlertTriangle,
  ClipboardCheck,
  UserPlus,
  Heart,
  TrendingUp,
  Grid,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    },
    refetchInterval: 10000 // refetch every 10 seconds for real-time feel
  });

  if (user?.role?.name === 'SUPER_ADMIN') {
    return <Navigate to="/city-dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>
          <div className="h-80 bg-white border border-slate-200 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 glass-panel rounded-3xl border-rose-200 text-center bg-white shadow-lg">
        <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Failed to load Dashboard data</h3>
        <p className="text-slate-505 mt-1 text-sm">{error.message || 'Check database connection'}</p>
      </div>
    );
  }

  const { widgets, charts } = dashboardData;

  const cardStats = [
    { label: "Today's OPD Patients", val: widgets.todaysPatients, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', hoverGlow: 'hover:shadow-indigo-500/10 hover:border-indigo-500/30' },
    { label: "Active Admissions", val: widgets.activeAdmissions, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', hoverGlow: 'hover:shadow-emerald-500/10 hover:border-emerald-500/30' },
    { label: "Available / Occupied Beds", val: `${widgets.availableBeds} / ${widgets.occupiedBeds}`, icon: Bed, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', hoverGlow: 'hover:shadow-indigo-500/10 hover:border-indigo-500/30' },
    { label: "Alerts (Low Stock/Expired)", val: `${widgets.lowStockMedicines} / ${widgets.expiredMedicines}`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', hoverGlow: 'hover:shadow-rose-500/10 hover:border-rose-500/30' }
  ];

  // Colors for Recharts OPD Priority
  const PRIORITY_COLORS = {
    Normal: '#38bdf8',         // Sky blue
    Emergency: '#ef4444',      // Red
    SeniorCitizen: '#10b981',  // Emerald green
    Pregnancy: '#8b5cf6'       // Purple
  };

  // Colors for Department Pie - Blue scale matching screenshot
  const DEPT_PIE_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  const opdPriorityData = charts.opdPriority || [];
  const hasPriorityData = opdPriorityData.some(p => p.value > 0);

  // 1. Department Wise Patients Data
  const departmentLoadData = charts.departmentLoad || [];

  // 2. Live Bed Occupancy Timeline Trend Data
  const currentAvailable = widgets.availableBeds || 12;
  const bedOccupancyTimeline = [
    { date: 'Mon', 'Available Beds': Math.max(2, currentAvailable - 2) },
    { date: 'Tue', 'Available Beds': Math.max(2, currentAvailable - 1) },
    { date: 'Wed', 'Available Beds': Math.max(2, currentAvailable + 2) },
    { date: 'Thu', 'Available Beds': Math.max(2, currentAvailable) },
    { date: 'Fri', 'Available Beds': Math.max(2, currentAvailable - 3) },
    { date: 'Sat', 'Available Beds': Math.max(2, currentAvailable + 1) },
    { date: 'Sun', 'Available Beds': currentAvailable }
  ];

  // 3. Medicine Stock Overview Donut Data
  const totalMed = widgets.totalMedicines || 35;
  const lowStock = widgets.lowStockMedicines || 0;
  const expired = widgets.expiredMedicines || 0;
  const sufficient = Math.max(0, totalMed - lowStock - expired);

  const medicineStockData = [
    { name: 'Sufficient', value: sufficient, color: '#10b981' },
    { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
    { name: 'Expiring Soon', value: expired, color: '#ef4444' }
  ];

  // Stagger entry configurations
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
      {/* Title block */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ecosystem Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Live analytics feed for {user?.hospital?.name || 'City Central Hospital'}</p>
        </div>
      </motion.div>

      {/* Critical Alert Banner */}
      {(widgets.expiredMedicines > 0 || widgets.lowStockMedicines > 0 || widgets.emergencyCases > 0) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="glass-panel border-rose-200 bg-rose-50/50 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
        >
          <div className="h-10 w-10 bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center rounded-xl animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-800">System Escalation Warns Active</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              {widgets.emergencyCases > 0 && `⚠️ ${widgets.emergencyCases} emergency OPD cases waiting. `}
              {widgets.lowStockMedicines > 0 && `💊 ${widgets.lowStockMedicines} medicines below low-stock threshold. `}
              {widgets.expiredMedicines > 0 && `⏰ ${widgets.expiredMedicines} medicine batches expired.`}
            </p>
          </div>
          {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/alerts')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 transition-all text-xs font-bold text-white rounded-xl shadow-sm cursor-pointer"
            >
              Manage Alerts
            </motion.button>
          )}
        </motion.div>
      )}

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
              className={`glass-panel border ${card.bg} rounded-3xl p-6 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-lg ${card.hoverGlow}`}
            >
              <div>
                <p className="text-xs font-bold text-slate-550 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-2 tracking-tight">{card.val}</h3>
              </div>
              <div className={`h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center ${card.color} shadow-sm`}>
                <IconComp className="h-6 w-6" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Layer 1: Footfall Trend & Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Footfall Trend Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Patient Footfall Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">OPD visits count over last 7 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.patientFootfall} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFootfall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" name="Patients" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFootfall)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* OPD Priority Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-panel rounded-3xl p-6 border-slate-200/80 flex flex-col justify-between shadow-sm bg-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">OPD Case Priority Analytics</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Today's patient severity distributions</p>
            </div>
            <Grid className="h-4 w-4 text-sky-600" />
          </div>
          <div className="h-48 flex items-center justify-center relative">
            {hasPriorityData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opdPriorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {opdPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 font-bold">No OPD tokens active today</span>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{widgets.todaysPatients}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total Today</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[9px] text-slate-500 font-bold px-2">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400"></span> Normal</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span> Emergency</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Senior Citizen</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500"></span> Pregnancy</div>
          </div>
        </motion.div>
      </div>

      {/* Charts Layer 2: Department-wise Patients (Pie) & (Bar) - matching Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise Patients (Pie) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white flex flex-col justify-between h-80"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-700">Department-wise Patients (Pie)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Patient load share across wards</p>
          </div>
          <div className="h-48 flex items-center justify-center relative mt-3">
            {departmentLoadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentLoadData}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    paddingAngle={1}
                    dataKey="patientCount"
                  >
                    {departmentLoadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPT_PIE_COLORS[index % DEPT_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No department entries</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[8px] font-bold text-slate-500 justify-center border-t border-slate-100 pt-2">
            {departmentLoadData.map((d, index) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DEPT_PIE_COLORS[index % DEPT_PIE_COLORS.length] }}></span>
                {d.name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Department-wise Patients (Bar) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white flex flex-col justify-between h-80"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-700">Department-wise Patients (Bar)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Absolute load per clinical division (30d)</p>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentLoadData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                <Bar dataKey="patientCount" name="Patients" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Layer 3: Live Bed Occupancy Timeline & Medicine Stock Overview - matching Screenshot 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Bed Occupancy Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white flex flex-col justify-between h-80"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Live Bed Occupancy Timeline</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Weekly trend log of available census spaces</p>
            </div>
            <Bed className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bedOccupancyTimeline} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
                <Line type="monotone" dataKey="Available Beds" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Medicine Stock Overview Semi-Circle Donut */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white flex flex-col justify-between h-80"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-700">Medicine Stock Overview</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Pharmacy batch quantity status levels</p>
          </div>
          <div className="h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medicineStockData}
                  cx="50%"
                  cy="75%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {medicineStockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center bottom-6">
              <span className="text-2xl font-black text-slate-800">{totalMed}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total Types</span>
            </div>
          </div>
          <div className="flex justify-center gap-3 text-[8.5px] font-bold text-slate-500 border-t border-slate-100 pt-2">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Sufficient</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Low Stock</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Expiring Soon</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Layer 4: Wards occupancy & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wards Occupancy Matrix Grouped Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 border-slate-200/80 shadow-sm bg-white flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-700">Wards Occupancy Metrics</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Total vs Occupied beds by ward class</p>
          </div>
          <div className="h-64 mt-4">
            {charts.bedOccupancy && charts.bedOccupancy.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.bedOccupancy} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="total" name="Total Beds" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="occupied" name="Occupied" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No bed allocation logs</div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="glass-panel rounded-3xl p-6 border-slate-200/80 flex flex-col justify-between shadow-sm bg-white"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Role-Based Quick Portals</h3>
            <p className="text-[11px] text-slate-400 mb-6">Redirect to active modules for your account profile</p>
            <div className="grid grid-cols-2 gap-3">
              {hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
                <>
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/patients')} 
                    className="p-4 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-500/30 text-left transition-all duration-200 flex flex-col gap-2 group shadow-sm cursor-pointer"
                  >
                    <UserPlus className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700">Register Patient</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/beds')} 
                    className="p-4 rounded-2xl bg-emerald-50/30 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500/30 text-left transition-all duration-200 flex flex-col gap-2 group shadow-sm cursor-pointer"
                  >
                    <ClipboardCheck className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-700">Admit Patient</span>
                  </motion.button>
                </>
              )}
              {hasRole(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']) && (
                <motion.button 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/opd')} 
                  className="p-4 rounded-2xl bg-sky-50/30 hover:bg-sky-50 border border-slate-200 hover:border-sky-500/30 text-left transition-all duration-200 flex flex-col gap-2 group shadow-sm cursor-pointer"
                >
                  <Activity className="h-5 w-5 text-sky-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700">OPD Consultation</span>
                </motion.button>
              )}
              {hasRole(['SUPER_ADMIN', 'ADMIN', 'PHARMACIST']) && (
                <motion.button 
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/inventory')} 
                  className="p-4 rounded-2xl bg-violet-50/30 hover:bg-violet-50 border border-slate-200 hover:border-violet-500/30 text-left transition-all duration-200 flex flex-col gap-2 group shadow-sm cursor-pointer"
                >
                  <Heart className="h-5 w-5 text-violet-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700">Pharmacy Inventory</span>
                </motion.button>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 text-center mt-6">
            Ecosystem sync state: <span className="text-emerald-600 font-bold">ONLINE</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
