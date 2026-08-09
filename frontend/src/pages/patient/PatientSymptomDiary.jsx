import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Activity, Plus, Calendar, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Shortness of Breath',
  'Chest Pain', 'Nausea', 'Dizziness', 'Joint Pain', 'Back Pain',
  'Abdominal Pain', 'Sore Throat', 'Loss of Taste/Smell'
];

const PatientSymptomDiary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    symptoms: [],
    severity: 'Mild',
    notes: ''
  });

  const fetchEntries = async () => {
    try {
      const res = await api.get('/patient-portal/symptoms');
      if (res.data.status === 'success') {
        setEntries(res.data.data.entries);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load symptom diary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const toggleSymptom = (sym) => {
    if (form.symptoms.includes(sym)) {
      setForm({ ...form, symptoms: form.symptoms.filter(s => s !== sym) });
    } else {
      setForm({ ...form, symptoms: [...form.symptoms, sym] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.symptoms.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    try {
      const res = await api.post('/patient-portal/symptoms', form);
      if (res.data.status === 'success') {
        toast.success('Symptom entry logged!');
        setShowModal(false);
        setForm({ symptoms: [], severity: 'Mild', notes: '' });
        fetchEntries();
      }
    } catch (err) {
      toast.error('Failed to log symptoms');
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daily Symptom Diary</h1>
          <p className="text-xs font-semibold text-slate-500">Track day-to-day symptoms to present accurate reports during doctor consultations</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Log Daily Symptoms</span>
        </button>
      </div>

      {/* Entries Timeline Grid */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200">
            <Activity className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No symptom entries logged yet</h3>
            <p className="text-xs text-slate-500 mt-1">Keep a daily record to help your doctor monitor recovery.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  entry.severity === 'Severe' ? 'bg-rose-100 text-rose-800' :
                  entry.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                }`}>
                  {entry.severity} Severity
                </span>
                <span className="text-xs font-bold text-slate-400">
                  📅 {new Date(entry.loggedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {entry.symptoms.map((s, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                    {s}
                  </span>
                ))}
              </div>

              {entry.notes && (
                <p className="text-xs text-slate-600 font-medium italic border-t border-slate-100 pt-2">
                  "{entry.notes}"
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">Log Daily Symptoms</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Select Symptoms *</label>
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1">
                  {commonSymptoms.map(s => {
                    const isSelected = form.symptoms.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Overall Severity *</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="Mild">Mild - Managed easily</option>
                  <option value="Moderate">Moderate - Interferes with daily routine</option>
                  <option value="Severe">Severe - Urgent discomfort</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes / Trigger Factors</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Started after dinner, worsening at night..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Symptom Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientSymptomDiary;
