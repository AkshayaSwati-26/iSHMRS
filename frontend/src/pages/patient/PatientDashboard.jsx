import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HeartPulse,
  Clock,
  Calendar,
  Pill,
  Activity,
  BedDouble,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  FolderOpen
} from 'lucide-react';

const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/patient-portal/dashboard');
      if (res.data.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Listen to live queue updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('queue_updated', () => {
      fetchDashboard();
    });

    socket.on('token_called', (token) => {
      if (data?.activeOPDToken?.id === token.id) {
        toast.success(`🔔 YOUR TOKEN #${token.tokenNumber} IS CALLED in ${token.department?.name}! Please proceed to room.`, {
          duration: 10000,
          position: 'top-center'
        });
        fetchDashboard();
      }
    });

    return () => {
      socket.off('queue_updated');
      socket.off('token_called');
    };
  }, [socket, data?.activeOPDToken?.id]);

  const handleMedicationTaken = async (id) => {
    try {
      const res = await api.put(`/patient-portal/medications/${id}/taken`);
      if (res.data.status === 'success') {
        toast.success('Medication marked as taken!');
        fetchDashboard();
      }
    } catch (err) {
      toast.error('Failed to update medication status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { patient, activeAdmission, nextAppointment, activeOPDToken, healthScore, todayMedications } = data || {};

  return (
    <div className="space-y-6">

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md border border-white/30 text-white tracking-wider">
                {patient?.uhid || 'PATIENT PORTAL'}
              </span>
              {patient?.bloodGroup && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/80 text-white border border-rose-400">
                  {patient.bloodGroup}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {patient?.name || 'Patient'}!
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm font-medium mt-1">
              Here is your real-time health overview and care updates today.
            </p>
          </div>

          {/* Health Score Badge */}
          {healthScore !== null && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4 shrink-0">
              <div className="h-12 w-12 rounded-xl bg-white text-teal-800 flex items-center justify-center font-black text-xl shadow-inner">
                {healthScore}
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-100">Health Score</h4>
                <p className="text-xs font-semibold text-white">
                  {healthScore >= 80 ? '💚 Excellent Status' : healthScore >= 60 ? '💛 Moderate Watch' : '❤️ Needs Attention'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Active OPD Queue & Next Appointment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Live OPD Token Tracker Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel rounded-3xl p-6 border border-teal-100 shadow-md relative overflow-hidden bg-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                <Clock className="h-5 w-5 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Live OPD Queue Tracker</h3>
                <p className="text-[11px] text-slate-500 font-medium">Real-time socket synchronized</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 animate-pulse">
              LIVE
            </span>
          </div>

          {activeOPDToken ? (
            <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-teal-700 tracking-wider uppercase">Token Number</span>
                  <div className="text-3xl font-black text-teal-900">#{activeOPDToken.tokenNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Status</span>
                  <div className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-xs">
                    {activeOPDToken.status}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-teal-200/60 text-xs text-slate-700 space-y-1">
                <div><strong>Department:</strong> {activeOPDToken.department?.name}</div>
                {activeOPDToken.doctor && (
                  <div><strong>Attending Doctor:</strong> Dr. {activeOPDToken.doctor.firstName} {activeOPDToken.doctor.lastName}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Stethoscope className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-600">No active OPD consultation token today</p>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="mt-3 text-xs font-extrabold text-teal-700 hover:text-teal-900 underline"
              >
                Book Appointment / Get Token →
              </button>
            </div>
          )}
        </motion.div>

        {/* Next Scheduled Appointment */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel rounded-3xl p-6 border border-teal-100 shadow-md bg-white flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Next Scheduled Visit</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Upcoming appointment details</p>
                </div>
              </div>
            </div>

            {nextAppointment ? (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-900">
                    Dr. {nextAppointment.doctor?.firstName} {nextAppointment.doctor?.lastName}
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    {nextAppointment.timeSlot}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {nextAppointment.department?.name} Department
                </p>
                <p className="text-xs font-semibold text-emerald-700">
                  📅 {new Date(nextAppointment.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-600">No upcoming appointments scheduled</p>
                <button
                  onClick={() => navigate('/patient/appointments')}
                  className="mt-3 text-xs font-extrabold text-teal-700 hover:text-teal-900 underline"
                >
                  Schedule Appointment Now →
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigate('/patient/appointments')}
              className="text-xs font-extrabold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Appointments</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

      </div>

      {/* Admission Alert (If Currently Admitted) */}
      {activeAdmission && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <BedDouble className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/30 text-white tracking-wider">
                CURRENT INPATIENT ADMISSION
              </span>
              <h3 className="text-lg font-black mt-1">
                Bed: {activeAdmission.bed?.label} · Ward: {activeAdmission.bed?.room?.ward?.name}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Admitted on {new Date(activeAdmission.admittedAt).toLocaleDateString()} under Dr. {activeAdmission.doctor?.firstName} {activeAdmission.doctor?.lastName}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/patient/admission')}
            className="px-4 py-2.5 rounded-xl bg-white text-amber-900 font-extrabold text-xs hover:bg-amber-50 transition-all cursor-pointer shrink-0"
          >
            View Admission Details →
          </button>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div>
        <h3 className="text-sm font-black text-slate-800 tracking-tight mb-3">Quick Patient Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { label: 'Book Appointment', icon: Calendar, path: '/patient/appointments', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
            { label: 'Log Vitals', icon: Activity, path: '/patient/vitals', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'My Prescriptions', icon: Pill, path: '/patient/prescriptions', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
            { label: 'Medical Vault', icon: FolderOpen, path: '/patient/documents', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-2xl border ${action.bg} cursor-pointer transition-all flex flex-col justify-between h-28 shadow-xs`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-black tracking-tight">{action.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Today's Medications Checklist */}
      {todayMedications && todayMedications.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-violet-600" />
              <h3 className="text-sm font-black text-slate-800">Today's Medication Reminder Schedule</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {todayMedications.map((med) => (
              <div
                key={med.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  med.isTaken ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <h4 className="text-xs font-black">{med.medicineName}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{med.dosage} · Scheduled: {med.scheduledTime}</p>
                </div>

                <button
                  onClick={() => !med.isTaken && handleMedicationTaken(med.id)}
                  disabled={med.isTaken}
                  className={`p-2 rounded-xl text-xs font-bold transition-all ${
                    med.isTaken ? 'bg-emerald-200 text-emerald-800 cursor-default' : 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
                  }`}
                >
                  {med.isTaken ? <CheckCircle className="h-4 w-4" /> : 'Mark Taken'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
