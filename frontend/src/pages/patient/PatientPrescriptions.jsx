import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pill, Printer, Calendar, Stethoscope, CheckCircle, FileText } from 'lucide-react';

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/patient-portal/prescriptions');
      if (res.data.status === 'success') {
        setPrescriptions(res.data.data.prescriptions);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handlePrint = () => {
    window.print();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Prescription Records</h1>
          <p className="text-xs font-semibold text-slate-500">Official medical prescriptions issued by your attending doctors</p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200">
          <Pill className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No digital prescriptions on record</h3>
          <p className="text-xs text-slate-500 mt-1">Prescriptions issued during consultations will automatically appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => (
            <div key={rx.consultationId} className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-4 shadow-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Dr. {rx.doctor?.firstName} {rx.doctor?.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{rx.department?.name} Department</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-500">
                    📅 Date: {new Date(rx.date).toLocaleDateString()}
                  </span>
                  {rx.diagnosis && (
                    <p className="text-xs font-extrabold text-teal-800">Diagnosis: {rx.diagnosis}</p>
                  )}
                </div>
              </div>

              {/* Medicine Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                      <th className="p-3">Medicine Name</th>
                      <th className="p-3">Dosage / Frequency</th>
                      <th className="p-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(rx.medicines) ? rx.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-800">{med.name || med.medicineName || med}</td>
                        <td className="p-3 text-slate-600">{med.dosage || med.frequency || 'As directed'}</td>
                        <td className="p-3 text-slate-600">{med.instructions || med.notes || 'Take after meals'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="p-3 text-slate-600">{JSON.stringify(rx.medicines)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {rx.followUpDate && (
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs font-bold text-teal-900">
                  🗓️ Recommended Follow-up Date: {new Date(rx.followUpDate).toLocaleDateString()}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default PatientPrescriptions;
