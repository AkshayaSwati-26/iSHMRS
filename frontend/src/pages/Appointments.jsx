import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Building,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

const TIME_SLOTS = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  "11:30 AM - 12:00 PM",
  "02:00 PM - 02:30 PM",
  "02:30 PM - 03:00 PM",
  "03:00 PM - 03:30 PM",
  "03:30 PM - 04:00 PM",
  "04:00 PM - 04:30 PM",
  "04:30 PM - 05:00 PM"
];

const Appointments = () => {
  const { user, hasRole } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);

  // Form Booking State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');

  // Fetch appointments list
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data.appointments;
    }
  });

  // Fetch departments (mapped from beds endpoint)
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/beds');
      const uniqueDepts = {};
      res.data.data.beds.forEach(b => {
        const d = b.room.ward.department;
        uniqueDepts[d.id] = d;
      });
      return Object.values(uniqueDepts);
    }
  });

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data.patients;
    }
  });

  // Fetch doctors
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/auth/doctors');
      return res.data.data.doctors;
    }
  });

  // Real-time socket integration
  useEffect(() => {
    if (!socket) return;
    const refreshAppts = () => {
      queryClient.invalidateQueries(['appointments']);
    };
    socket.on('appointment_created', refreshAppts);
    socket.on('appointment_updated', refreshAppts);
    socket.on('appointment_deleted', refreshAppts);

    return () => {
      socket.off('appointment_created', refreshAppts);
      socket.off('appointment_updated', refreshAppts);
      socket.off('appointment_deleted', refreshAppts);
    };
  }, [socket, queryClient]);

  // Create Appointment Mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/appointments', payload);
      return res.data.data.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Appointment booked successfully!');
      // Reset form
      setPatientId('');
      setDoctorId('');
      setDepartmentId('');
      setAppointmentDate('');
      setTimeSlot(TIME_SLOTS[0]);
      setNotes('');
      setShowBookForm(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Booking failed');
    }
  });

  // Update Status/Reschedule Mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/appointments/${id}`, payload);
      return res.data.data.appointment;
    },
    onSuccess: (appt) => {
      queryClient.invalidateQueries(['appointments']);
      toast.success(`Appointment status updated to ${appt.status}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Update failed');
    }
  });

  // Cancel/Delete Appointment Mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/appointments/${id}`);
      return res.data.data.appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      toast.success('Appointment cancelled successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Cancellation failed');
    }
  });

  const handleBook = (e) => {
    e.preventDefault();
    if (!patientId || !doctorId || !departmentId || !appointmentDate || !timeSlot) {
      toast.error('Please fill in all mandatory fields');
      return;
    }
    createAppointmentMutation.mutate({
      patientId,
      doctorId,
      departmentId,
      appointmentDate,
      timeSlot,
      notes
    });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'NoShow':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  const filteredAppts = appointments?.filter(appt =>
    appt.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appt.patient.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${appt.doctor.firstName} ${appt.doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">OPD Appointment Desk</h2>
          <p className="text-sm text-slate-500 mt-1">Manage doctor schedules, patient check-ins, time-slots, and real-time reminders</p>
        </div>
        {hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
          <button
            onClick={() => setShowBookForm(!showBookForm)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 text-xs font-bold text-white rounded-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>{showBookForm ? 'Show Booking Schedule' : 'Schedule Appointment'}</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showBookForm ? (
          /* Booking Form Card */
          <motion.div
            key="booking-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-panel border-slate-200/80 rounded-3xl p-6 max-w-2xl mx-auto shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/60 pb-4 mb-6">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Book Appointment Slot</h3>
            </div>

            <form onSubmit={handleBook} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Select Patient */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Select Patient *</label>
                  <select
                    required
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients?.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                    ))}
                  </select>
                </div>

                {/* Select Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Specialty Department *</label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- Choose Specialty --</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Select Doctor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Consulting Physician *</label>
                  <select
                    required
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors?.map(doc => (
                      <option key={doc.id} value={doc.id}>Dr. {doc.firstName} {doc.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date of Visit *</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Time Slot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Available Time Slot *</label>
                  <select
                    required
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Symptoms / Brief Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Regular orthopedics follow-up"
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowBookForm(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {createAppointmentMutation.isPending ? 'Confirming...' : 'Book OPD Slot'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Appointment Directory Grid & Filters */
          <motion.div
            key="directory-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search appointments by Patient name, Doctor name, or UHID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs outline-none focus:border-indigo-500/60"
                />
              </div>
              <button
                onClick={() => toast.success('Appointments sheet exported!')}
                className="flex items-center gap-1.5 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 bg-white rounded-xl transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>

            <div className="glass-panel border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse text-xs">Fetching active appointments...</div>
              ) : filteredAppts.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                  <Calendar className="h-10 w-10 text-slate-300" />
                  <span>No active appointments scheduled.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/60 font-bold uppercase tracking-wider">
                        <th className="p-4">Appointment Date</th>
                        <th className="p-4">Time Slot</th>
                        <th className="p-4">Patient UHID</th>
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Physician</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAppts.map((appt) => (
                        <tr key={appt.id} className="hover:bg-slate-50/60 text-slate-600 transition-all">
                          <td className="p-4 font-mono font-bold text-slate-800">
                            {new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-4 font-mono font-semibold text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-indigo-500" />
                              {appt.timeSlot}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-indigo-600">{appt.patient.uhid}</td>
                          <td className="p-4 font-bold text-slate-800">{appt.patient.name}</td>
                          <td className="p-4 font-semibold text-slate-700">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                              <Building className="h-3.5 w-3.5 text-indigo-400" />
                              {appt.department.name}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${getStatusBadgeStyle(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            {appt.status === 'Scheduled' && (
                              <>
                                {hasRole(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']) && (
                                  <button
                                    onClick={() => updateAppointmentMutation.mutate({ id: appt.id, payload: { status: 'Completed' } })}
                                    className="p-1 px-2.5 rounded-lg border border-emerald-100 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 transition-all font-bold text-[10px]"
                                    title="Mark Completed"
                                  >
                                    Complete
                                  </button>
                                )}
                                {hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
                                  <button
                                    onClick={() => cancelAppointmentMutation.mutate(appt.id)}
                                    className="p-1 px-2 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-500 transition-all font-bold text-[10px]"
                                    title="Cancel Appointment"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </>
                            )}
                            {appt.status === 'Scheduled' && hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
                              <button
                                onClick={() => {
                                  const newSlot = prompt('Enter rescheduled time slot:', appt.timeSlot);
                                  if (newSlot && newSlot !== appt.timeSlot) {
                                    updateAppointmentMutation.mutate({
                                      id: appt.id,
                                      payload: { timeSlot: newSlot }
                                    });
                                  }
                                }}
                                className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-all font-bold text-[10px]"
                              >
                                Reschedule
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appointments;
export { Appointments };
