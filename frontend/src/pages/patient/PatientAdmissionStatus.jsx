import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BedDouble, Stethoscope, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const PatientAdmissionStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdmissionStatus = async () => {
    try {
      const res = await api.get('/patient-portal/admission');
      if (res.data.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admission status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissionStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { currentAdmission, recentDischarge } = data || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inpatient Admission Tracker</h1>
        <p className="text-xs font-semibold text-slate-500">Live ward bed allocation and discharge status</p>
      </div>

      {/* Active Admission */}
      {currentAdmission ? (
        <div className="glass-panel rounded-3xl p-6 border-2 border-amber-300 bg-amber-50/40 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white uppercase tracking-wider">
              ACTIVE INPATIENT ADMISSION
            </span>
            <span className="text-xs font-bold text-amber-900">
              Admitted: {new Date(currentAdmission.admittedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-extrabold text-amber-800 tracking-wider uppercase">Allocated Bed</span>
              <div className="text-2xl font-black text-amber-900 mt-1">Bed {currentAdmission.bed?.label}</div>
              <p className="text-xs text-slate-600 font-medium">Room: {currentAdmission.bed?.room?.name} · Ward: {currentAdmission.bed?.room?.ward?.name}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-extrabold text-amber-800 tracking-wider uppercase">Attending Doctor & Dept</span>
              <div className="text-base font-black text-slate-800 mt-1">Dr. {currentAdmission.doctor?.firstName} {currentAdmission.doctor?.lastName}</div>
              <p className="text-xs text-slate-600 font-medium">Department: {currentAdmission.department?.name}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200 bg-white">
          <BedDouble className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-700">Not currently admitted to any ward bed</h3>
          <p className="text-xs text-slate-500 mt-1">You are currently listed as an Outpatient.</p>
        </div>
      )}

      {/* Recent Discharge Summary */}
      {recentDischarge && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-800">Previous Discharge Summary</h3>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <div><strong>Department:</strong> {recentDischarge.department?.name}</div>
            <div><strong>Attending Doctor:</strong> Dr. {recentDischarge.doctor?.firstName} {recentDischarge.doctor?.lastName}</div>
            {recentDischarge.discharges?.[0] && (
              <>
                <div><strong>Discharged On:</strong> {new Date(recentDischarge.discharges[0].dischargedAt).toLocaleDateString()}</div>
                <div><strong>Summary & Advice:</strong> {recentDischarge.discharges[0].summary || 'None'}</div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientAdmissionStatus;
