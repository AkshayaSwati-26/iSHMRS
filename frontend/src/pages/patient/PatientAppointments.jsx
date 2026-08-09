import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Plus, Clock, User, CheckCircle, XCircle, Stethoscope, AlertCircle } from 'lucide-react';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Booking Form State
  const [form, setForm] = useState({
    doctorId: '',
    departmentId: '',
    appointmentDate: '',
    timeSlot: '09:00 AM',
    notes: '',
    preConsultationForm: { symptoms: '', duration: '', urgency: 'Normal' }
  });

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/patient-portal/appointments');
      if (res.data.status === 'success') {
        setAppointments(res.data.data.appointments);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/auth/doctors');
      if (res.data.status === 'success') {
        setDoctors(res.data.data.doctors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.doctorId || !form.appointmentDate || !form.timeSlot) {
      toast.error('Please select doctor, date, and time slot');
      return;
    }

    try {
      const selectedDoc = doctors.find(d => d.id === form.doctorId);
      const res = await api.post('/patient-portal/appointments', {
        ...form,
        departmentId: selectedDoc?.hospitalId || form.departmentId // fallback
      });

      if (res.data.status === 'success') {
        toast.success('Appointment booked successfully!');
        setShowModal(false);
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const res = await api.put(`/patient-portal/appointments/${id}/cancel`, { reason: 'Cancelled by patient' });
      if (res.data.status === 'success') {
        toast.success('Appointment cancelled');
        fetchAppointments();
      }
    } catch (err) {
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Appointments Management</h1>
          <p className="text-xs font-semibold text-slate-500">Book new visits with specialist doctors and view your appointment schedule</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Appointments List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((app) => (
          <div key={app.id} className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                app.status === 'Scheduled' ? 'bg-emerald-100 text-emerald-800' :
                app.status === 'Completed' ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {app.status}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {new Date(app.appointmentDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-800">
                Dr. {app.doctor?.firstName} {app.doctor?.lastName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Department: {app.department?.name || 'General'}</p>
              <p className="text-xs font-semibold text-teal-700 mt-1">⏰ Time Slot: {app.timeSlot}</p>
            </div>

            {app.status === 'Scheduled' && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleCancel(app.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel Visit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">Book Doctor Appointment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleBook} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Doctor *</label>
                <select
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">-- Choose Specialist Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Time Slot *</label>
                  <select
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Pre-Consultation Symptoms / Reason for Visit</label>
                <textarea
                  rows="2"
                  placeholder="Describe your current symptoms or reason for visiting..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-teal-600/20"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientAppointments;
