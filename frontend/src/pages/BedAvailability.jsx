import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble,
  Activity,
  Trash2,
  Share2,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  UserCheck,
  Building,
  UserX,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const BedAvailability = () => {
  const { user, hasRole } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();

  // Dialog configurations
  const [selectedBed, setSelectedBed] = useState(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [showDischargeForm, setShowDischargeForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [dischargeReason, setDischargeReason] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [targetBedId, setTargetBedId] = useState('');

  // Fetch beds
  const { data: bedsData, isLoading } = useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const res = await api.get('/beds');
      return res.data.data.beds;
    }
  });

  // Fetch registered patients who are NOT admitted
  const { data: patientsData } = useQuery({
    queryKey: ['nonAdmittedPatients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data.patients.filter(p => !p.isAdmitted);
    }
  });

  // Fetch doctors for admission dropdown
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/auth/doctors');
      return res.data.data.doctors;
    }
  });

  // Real-time socket events for bed status board
  useEffect(() => {
    if (!socket) return;

    const refreshBeds = () => {
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['nonAdmittedPatients']);
    };

    socket.on('bed_assigned', refreshBeds);
    socket.on('bed_released', refreshBeds);
    socket.on('bed_status_changed', refreshBeds);

    return () => {
      socket.off('bed_assigned', refreshBeds);
      socket.off('bed_released', refreshBeds);
      socket.off('bed_status_changed', refreshBeds);
    };
  }, [socket, queryClient]);

  // Mutations
  const updateBedStatusMutation = useMutation({
    mutationFn: async ({ bedId, status }) => {
      const res = await api.put(`/beds/${bedId}/status`, { status });
      return res.data.data.bed;
    },
    onSuccess: (bed) => {
      queryClient.invalidateQueries(['beds']);
      toast.success(`Bed status changed to ${bed.status}`);
      setSelectedBed(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Status update failed');
    }
  });

  const admitPatientMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/admissions', payload);
      return res.data.data.admission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['nonAdmittedPatients']);
      toast.success('Patient admitted to ward successfully!');
      setSelectedBed(null);
      setShowAdmitForm(false);
      setPatientId('');
      setDoctorId('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Admission failed');
    }
  });

  const dischargePatientMutation = useMutation({
    mutationFn: async ({ admissionId, payload }) => {
      const res = await api.post(`/admissions/${admissionId}/discharge`, payload);
      return res.data.data.discharge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['beds']);
      queryClient.invalidateQueries(['nonAdmittedPatients']);
      toast.success('Patient discharged. Bed released for sanitization.');
      setSelectedBed(null);
      setShowDischargeForm(false);
      setDischargeReason('');
      setDischargeSummary('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Discharge failed');
    }
  });

  const transferBedMutation = useMutation({
    mutationFn: async ({ admissionId, targetBedId }) => {
      const res = await api.post(`/admissions/${admissionId}/transfer`, { targetBedId });
      return res.data.data.admission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['beds']);
      toast.success('Patient transfer completed successfully.');
      setSelectedBed(null);
      setShowTransferForm(false);
      setTargetBedId('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Transfer failed');
    }
  });

  const handleAdmit = (e) => {
    e.preventDefault();
    if (!patientId || !doctorId) {
      toast.error('Choose patient and primary physician');
      return;
    }
    
    const deptId = selectedBed.room?.ward?.departmentId || selectedBed.room?.ward?.department?.id;
    if (!deptId) {
      toast.error('Internal Error: Bed department mapping missing');
      return;
    }

    admitPatientMutation.mutate({
      patientId,
      departmentId: deptId,
      doctorId,
      bedId: selectedBed.id
    });
  };

  const handleDischarge = (e) => {
    e.preventDefault();
    const activeAdm = selectedBed.admissions?.[0];
    if (!activeAdm) {
      toast.error('No active admission found for this bed');
      return;
    }
    dischargePatientMutation.mutate({
      admissionId: activeAdm.id,
      payload: { reason: dischargeReason, summary: dischargeSummary }
    });
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const activeAdm = selectedBed.admissions?.[0];
    if (!activeAdm) {
      toast.error('No active admission found for this bed');
      return;
    }
    if (!targetBedId) {
      toast.error('Select target bed for transfer');
      return;
    }
    transferBedMutation.mutate({
      admissionId: activeAdm.id,
      targetBedId
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': 
        return 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300 text-emerald-800';
      case 'Occupied': 
        return 'border-indigo-200 bg-indigo-50/70 hover:border-indigo-300 text-indigo-800';
      case 'Cleaning': 
        return 'border-amber-200 bg-amber-50/70 hover:border-amber-300 text-amber-800';
      case 'Maintenance': 
        return 'border-rose-200 bg-rose-50/70 hover:border-rose-300 text-rose-800';
      default: 
        return 'border-slate-200 bg-slate-50/70 text-slate-600';
    }
  };

  const availableBeds = bedsData?.filter(b => b.status === 'Available' && b.id !== selectedBed?.id) || [];

  // Group beds by department and status for stacked bar chart - matching user's first screenshot
  const departmentBedStats = React.useMemo(() => {
    if (!bedsData) return [];
    const deptMap = {};
    bedsData.forEach(bed => {
      const deptName = bed.room?.ward?.department?.name || 'General';
      const formattedDeptName = deptName.replace(' Department', '').replace(' Medicine', '');
      if (!deptMap[formattedDeptName]) {
        deptMap[formattedDeptName] = { name: formattedDeptName, Available: 0, Occupied: 0, Reserved: 0, Cleaning: 0 };
      }
      let statusKey = bed.status;
      if (statusKey === 'Maintenance' || statusKey === 'Reserved' || statusKey === 'TransferPending') {
        statusKey = 'Reserved';
      }
      if (deptMap[formattedDeptName][statusKey] !== undefined) {
        deptMap[formattedDeptName][statusKey]++;
      }
    });
    return Object.values(deptMap);
  }, [bedsData]);

  // Global beds status distribution for pie/donut chart - matching user's first screenshot
  const bedStatusDistribution = React.useMemo(() => {
    if (!bedsData) return [];
    const counts = { Reserved: 0, Available: 0, Occupied: 0, Cleaning: 0 };
    bedsData.forEach(bed => {
      let statusKey = bed.status;
      if (statusKey === 'Maintenance' || statusKey === 'Reserved' || statusKey === 'TransferPending') {
        statusKey = 'Reserved';
      }
      if (counts[statusKey] !== undefined) {
        counts[statusKey]++;
      }
    });
    return Object.keys(counts).map(status => ({
      name: status,
      value: counts[status]
    })).filter(item => item.value > 0);
  }, [bedsData]);

  const STATUS_COLORS = {
    Available: '#22c55e', // Green
    Reserved: '#f59e0b',  // Orange/Yellow
    Occupied: '#ef4444',  // Red
    Cleaning: '#8b5cf6'   // Purple
  };

  // Motion variants
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 14 } }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bed Board & Inpatient Census</h2>
        <p className="text-sm text-slate-505 mt-1">Real-time room occupancy, cleaning boards, and ward transfers</p>
      </motion.div>

      {/* Bed Analytics Graphs at Top of Bed Board Page */}
      {!isLoading && bedsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stacked Bar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-panel border-slate-200/80 rounded-3xl p-6 bg-white shadow-sm flex flex-col justify-between h-80"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-700">Bed Availability per Department</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Number of Beds per Status by Department</p>
            </div>
            <div className="h-56">
              {departmentBedStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentBedStats} margin={{ top: 10, right: 10, left: -28, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                    <Bar dataKey="Available" stackId="a" fill={STATUS_COLORS.Available} />
                    <Bar dataKey="Reserved" stackId="a" fill={STATUS_COLORS.Reserved} />
                    <Bar dataKey="Occupied" stackId="a" fill={STATUS_COLORS.Occupied} />
                    <Bar dataKey="Cleaning" stackId="a" fill={STATUS_COLORS.Cleaning} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-semibold">No bed records found</div>
              )}
            </div>
          </motion.div>

          {/* Donut Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-panel border-slate-200/80 rounded-3xl p-6 bg-white shadow-sm flex flex-col justify-between h-80"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-700">Beds Status Distribution (All Departments)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time status overview across clinical divisions</p>
            </div>
            <div className="h-56 flex items-center justify-center relative">
              {bedStatusDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bedStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {bedStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex justify-center gap-3 text-[9px] font-bold text-slate-550 bottom-2 border-t border-slate-100 pt-2 w-full">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Available</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Reserved</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Occupied</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500"></span> Cleaning</span>
                  </div>
                </>
              ) : (
                <div className="text-[10px] text-slate-400 font-semibold">Loading status breakdown...</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse text-xs">Loading bed sensor mapping...</div>
      ) : bedsData?.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">No hospital beds configured.</div>
      ) : (
        /* Beds Grid */
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beds Grid Sensor Registry</h3>
          <motion.div 
            variants={gridVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5"
          >
            {bedsData?.map((bed) => (
              <motion.button
                key={bed.id}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBed(bed)}
                className={`glass-panel border rounded-3xl p-5 flex flex-col justify-between text-left aspect-square transition-all duration-300 shadow-sm ${getStatusColor(bed.status)} ${
                  bed.status === 'Available' ? 'card-hover-emerald' :
                  bed.status === 'Occupied' ? 'card-hover-indigo' :
                  bed.status === 'Cleaning' ? 'card-hover-amber' :
                  'card-hover-rose'
                } cursor-pointer`}
              >
                <div className="flex items-center justify-between w-full">
                  <BedDouble className="h-5 w-5 opacity-90" />
                  <span className="text-[8px] font-black uppercase tracking-wider bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                    {bed.type}
                  </span>
                </div>

                <div className="space-y-1 mt-6">
                  <h4 className="text-sm font-extrabold text-slate-800 truncate">{bed.label.split(' - ').pop()}</h4>
                  <p className="text-[9px] text-slate-650 truncate font-semibold flex items-center gap-1">
                    <Building className="h-2.5 w-2.5 opacity-70" />
                    <span>{bed.room.ward.name.split(' ').slice(2).join(' ') || bed.room.name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black uppercase border-t border-slate-200/50 pt-2 w-full">
                  <span className={`h-2 w-2 rounded-full ${
                    bed.status === 'Available' ? 'bg-emerald-500' :
                    bed.status === 'Occupied' ? 'bg-indigo-500 animate-pulse' :
                    bed.status === 'Cleaning' ? 'bg-amber-500' :
                    'bg-rose-500'
                  }`}></span>
                  <span className="truncate">{bed.status === 'Occupied' && bed.admissions?.[0]?.patient?.name ? bed.admissions[0].patient.name : bed.status}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Bed Operations Drawer Modal */}
      <AnimatePresence>
        {selectedBed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              className="w-full max-w-md glass-panel border-slate-200/80 rounded-3xl p-6 relative bg-white shadow-xl"
            >
              <button
                onClick={() => { setSelectedBed(null); setShowAdmitForm(false); setShowDischargeForm(false); setShowTransferForm(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <AnimatePresence mode="wait">
                {showAdmitForm ? (
                  /* Admit Patient Form */
                  <motion.form 
                    key="admit"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleAdmit} 
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Admit Patient to {selectedBed.label}</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-505 uppercase">Select Patient Profile</label>
                      <select
                        required
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      >
                        <option value="">Choose Patient</option>
                        {patientsData?.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-505 uppercase">Select Primary Physician</label>
                      <select
                        required
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      >
                        <option value="">Choose Doctor</option>
                        {doctorsData?.map(doc => (
                          <option key={doc.id} value={doc.id}>Dr. {doc.firstName} {doc.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/60">
                      <button type="button" onClick={() => setShowAdmitForm(false)} className="px-4 py-2 rounded-lg border border-slate-250 text-xs font-bold text-slate-500 hover:bg-slate-50">Back</button>
                      <button type="submit" disabled={admitPatientMutation.isPending} className="px-5 py-2 bg-indigo-600 text-xs font-bold text-white rounded-lg hover:bg-indigo-500 shadow-md">Admit Inpatient</button>
                    </div>
                  </motion.form>
                ) : showDischargeForm ? (
                  /* Discharge Patient Form */
                  <motion.form 
                    key="discharge"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleDischarge} 
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Discharge Inpatient</h3>
                    <p className="text-xs text-slate-550">Completing discharge for <b>{selectedBed.admissions?.[0]?.patient?.name}</b>. This will release the bed to "Cleaning" status.</p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-505 uppercase">Discharge Reason</label>
                      <input type="text" value={dischargeReason} onChange={(e) => setDischargeReason(e.target.value)} placeholder="e.g. Recovered, Referred" className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-505 uppercase">Clinical Summary</label>
                      <textarea value={dischargeSummary} onChange={(e) => setDischargeSummary(e.target.value)} placeholder="Summary of treatment and follow-up advice..." className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white h-16 outline-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/60">
                      <button type="button" onClick={() => setShowDischargeForm(false)} className="px-4 py-2 rounded-lg border border-slate-250 text-xs font-bold text-slate-500 hover:bg-slate-50">Back</button>
                      <button type="submit" disabled={dischargePatientMutation.isPending} className="px-5 py-2 bg-rose-600 text-xs font-bold text-white rounded-lg hover:bg-rose-500 shadow-md">Discharge Patient</button>
                    </div>
                  </motion.form>
                ) : showTransferForm ? (
                  /* Transfer Bed Form */
                  <motion.form 
                    key="transfer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleTransfer} 
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Transfer Bed</h3>
                    <p className="text-xs text-slate-550">Transferring <b>{selectedBed.admissions?.[0]?.patient?.name}</b> from current bed.</p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-555 uppercase">Select Available Bed</label>
                      <select
                        required
                        value={targetBedId}
                        onChange={(e) => setTargetBedId(e.target.value)}
                        className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      >
                        <option value="">Choose Bed</option>
                        {availableBeds.map(b => (
                          <option key={b.id} value={b.id}>{b.label} ({b.type})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/60">
                      <button type="button" onClick={() => setShowTransferForm(false)} className="px-4 py-2 rounded-lg border border-slate-250 text-xs font-bold text-slate-500 hover:bg-slate-50">Back</button>
                      <button type="submit" disabled={transferBedMutation.isPending} className="px-5 py-2 bg-indigo-600 text-xs font-bold text-white rounded-lg hover:bg-indigo-500 shadow-md">Execute Transfer</button>
                    </div>
                  </motion.form>
                ) : (
                  /* Bed Info Details & Actions Drawer */
                  <motion.div 
                    key="details"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{selectedBed.label}</h3>
                      <p className="text-xs text-slate-550 mt-0.5">{selectedBed.room.ward.name} · Room: {selectedBed.room.name}</p>
                    </div>

                    {/* Bed Status badge */}
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-105 shadow-inner">
                      <span className="text-xs text-slate-500 font-bold uppercase">Sensor State:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                        selectedBed.status === 'Available' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                        selectedBed.status === 'Occupied' ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                        selectedBed.status === 'Cleaning' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                        'text-rose-700 bg-rose-50 border-rose-100'
                      }`}>{selectedBed.status}</span>
                    </div>

                    {/* Occupied Inpatient Details */}
                    {selectedBed.status === 'Occupied' && selectedBed.admissions?.[0] && (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                        <h4 className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Active Inpatient Details</h4>
                        <div className="text-xs flex justify-between"><span className="text-slate-500">Patient:</span> <span className="font-bold text-slate-800">{selectedBed.admissions[0].patient.name}</span></div>
                        <div className="text-xs flex justify-between"><span className="text-slate-500">UHID Code:</span> <span className="font-mono font-bold text-indigo-600">{selectedBed.admissions[0].patient.uhid}</span></div>
                        <div className="text-xs flex justify-between"><span className="text-slate-500">Admitted At:</span> <span className="text-slate-650">{new Date(selectedBed.admissions[0].admittedAt).toLocaleString()}</span></div>
                      </div>
                    )}

                    {/* Action buttons based on Role */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-200/60">
                      {/* Admit Action */}
                      {selectedBed.status === 'Available' && hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowAdmitForm(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all duration-200 shadow-md cursor-pointer"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Admit Patient</span>
                        </motion.button>
                      )}

                      {/* Discharge & Transfer actions */}
                      {selectedBed.status === 'Occupied' && (
                        <div className="grid grid-cols-2 gap-3">
                          {hasRole(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']) && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowDischargeForm(true)}
                              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all duration-200 shadow-md cursor-pointer"
                            >
                              <UserX className="h-4 w-4" />
                              <span>Discharge</span>
                            </motion.button>
                          )}
                          {hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'NURSE']) && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setShowTransferForm(true)}
                              className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-55 text-xs font-bold text-slate-605 bg-white transition-all duration-200 cursor-pointer"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>Transfer Bed</span>
                            </motion.button>
                          )}
                        </div>
                      )}

                      {/* Cleaning Sanitization trigger */}
                      {selectedBed.status === 'Cleaning' && hasRole(['SUPER_ADMIN', 'ADMIN', 'NURSE']) && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateBedStatusMutation.mutate({ bedId: selectedBed.id, status: 'Available' })}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all duration-200 shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Mark Bed Sanitized (Available)</span>
                        </motion.button>
                      )}

                      {/* Maintenance triggers */}
                      {hasRole(['SUPER_ADMIN', 'ADMIN', 'NURSE']) && (
                        selectedBed.status === 'Maintenance' ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateBedStatusMutation.mutate({ bedId: selectedBed.id, status: 'Available' })}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all duration-200 shadow-md cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Resolve Maintenance (Available)</span>
                          </motion.button>
                        ) : selectedBed.status !== 'Occupied' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateBedStatusMutation.mutate({ bedId: selectedBed.id, status: 'Maintenance' })}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-205 hover:bg-rose-50 text-xs font-bold text-rose-600 bg-white transition-all duration-200 cursor-pointer"
                          >
                            <Wrench className="h-4 w-4" />
                            <span>Send to Maintenance</span>
                          </motion.button>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BedAvailability;
export { BedAvailability };