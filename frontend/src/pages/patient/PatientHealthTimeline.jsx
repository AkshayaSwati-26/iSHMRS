import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Stethoscope, BedDouble, ChevronDown, Calendar, FileText } from 'lucide-react';

const PatientHealthTimeline = () => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedYear, setSelectedYear] = useState('ALL');

  const fetchTimeline = async () => {
    try {
      const yearQuery = selectedYear !== 'ALL' ? `?year=${selectedYear}` : '';
      const res = await api.get(`/patient-portal/timeline${yearQuery}`);
      if (res.data.status === 'success') {
        setTimeline(res.data.data.timeline);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load health timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personal Health Timeline</h1>
          <p className="text-xs font-semibold text-slate-500">Comprehensive chronological history of consultations and inpatient admissions</p>
        </div>

        {/* Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none shadow-xs"
        >
          <option value="ALL">All Years Timeline</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Timeline List */}
      {timeline.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200">
          <Clock className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No medical records found on your timeline</h3>
          <p className="text-xs text-slate-500 mt-1">Consultation notes and admission records will automatically appear here.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-teal-200 space-y-6">
          {timeline.map((item, index) => {
            const isConsultation = item.type === 'consultation';
            const data = item.data;
            const isExpanded = expandedId === data.id;

            return (
              <div key={data.id} className="relative group">
                
                {/* Timeline Dot Icon */}
                <div className={`absolute -left-[35px] top-1 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white ${
                  isConsultation ? 'bg-teal-600' : 'bg-amber-500'
                }`}>
                  {isConsultation ? <Stethoscope className="h-4 w-4" /> : <BedDouble className="h-4 w-4" />}
                </div>

                {/* Event Card */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-200 hover:border-teal-300 transition-all bg-white shadow-xs">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : data.id)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isConsultation ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isConsultation ? 'OPD Consultation' : 'Inpatient Admission'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-800 mt-1">
                        {isConsultation ? `Diagnosis: ${data.diagnosis || 'Consultation'}` : `Admitted to ${data.department?.name} Ward`}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Attending Doctor: Dr. {data.doctor?.firstName} {data.doctor?.lastName}
                      </p>
                    </div>

                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700"
                      >
                        {isConsultation ? (
                          <>
                            {data.symptoms && <div><strong>Symptoms Reported:</strong> {data.symptoms}</div>}
                            {data.vitals && (
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <strong>Vitals Recorded:</strong> {JSON.stringify(data.vitals)}
                              </div>
                            )}
                            {data.prescriptions && (
                              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                                <strong className="text-teal-900">Prescription Details:</strong>
                                <pre className="mt-1 text-xs text-slate-800 whitespace-pre-wrap font-sans">{JSON.stringify(data.prescriptions, null, 2)}</pre>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div><strong>Bed Label:</strong> {data.bed?.label}</div>
                            <div><strong>Admitted On:</strong> {new Date(data.admittedAt).toLocaleString()}</div>
                            {data.discharges?.[0] && (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                                <strong>Discharged On:</strong> {new Date(data.discharges[0].dischargedAt).toLocaleString()}
                                <div><strong>Discharge Summary:</strong> {data.discharges[0].summary || 'None'}</div>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PatientHealthTimeline;
