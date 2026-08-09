import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Activity, Plus, TrendingUp, Heart, Thermometer, Weight, Droplet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PatientVitals = () => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('BloodPressure');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    type: 'BloodPressure',
    value: '',
    value2: '',
    unit: 'mmHg',
    notes: ''
  });

  const vitalConfigs = {
    BloodPressure: { name: 'Blood Pressure', unit: 'mmHg', hasDiastolic: true, color: '#0d9488' },
    BloodSugar: { name: 'Blood Sugar', unit: 'mg/dL', hasDiastolic: false, color: '#e11d48' },
    Weight: { name: 'Weight', unit: 'kg', hasDiastolic: false, color: '#2563eb' },
    Temperature: { name: 'Body Temperature', unit: '°F', hasDiastolic: false, color: '#ea580c' },
    SpO2: { name: 'Oxygen Saturation (SpO2)', unit: '%', hasDiastolic: false, color: '#059669' },
    HeartRate: { name: 'Pulse / Heart Rate', unit: 'bpm', hasDiastolic: false, color: '#7c3aed' },
  };

  const fetchVitals = async () => {
    try {
      const res = await api.get(`/patient-portal/vitals?type=${selectedType}&days=60`);
      if (res.data.status === 'success') {
        setVitals(res.data.data.vitals);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vitals logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [selectedType]);

  const handleLogVital = async (e) => {
    e.preventDefault();
    if (!form.value) {
      toast.error('Please enter a vital value');
      return;
    }

    try {
      const res = await api.post('/patient-portal/vitals', {
        ...form,
        unit: vitalConfigs[form.type]?.unit || 'units'
      });

      if (res.data.status === 'success') {
        toast.success('Vital measurement logged successfully!');
        setShowModal(false);
        setForm({ type: selectedType, value: '', value2: '', unit: 'mmHg', notes: '' });
        fetchVitals();
      }
    } catch (err) {
      toast.error('Failed to log vital');
    }
  };

  const chartData = vitals.map(v => ({
    date: new Date(v.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Systolic: v.value,
    Diastolic: v.value2,
    Value: v.value
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vitals Tracker & Health Charts</h1>
          <p className="text-xs font-semibold text-slate-500">Log daily vitals and view historical health trends</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Log New Vital Measurement</span>
        </button>
      </div>

      {/* Vital Type Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {Object.keys(vitalConfigs).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedType === type
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {vitalConfigs[type].name}
          </button>
        ))}
      </div>

      {/* Chart Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">
            {vitalConfigs[selectedType].name} Trend ({vitalConfigs[selectedType].unit})
          </h3>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-semibold">
            No measurements logged for {vitalConfigs[selectedType].name} yet. Click "Log New Vital Measurement" above!
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                {selectedType === 'BloodPressure' ? (
                  <>
                    <Line type="monotone" dataKey="Systolic" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Diastolic" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                  </>
                ) : (
                  <Line type="monotone" dataKey="Value" stroke={vitalConfigs[selectedType].color} strokeWidth={3} dot={{ r: 4 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">Log Vital Measurement</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleLogVital} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vital Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                >
                  {Object.keys(vitalConfigs).map(k => (
                    <option key={k} value={k}>{vitalConfigs[k].name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {form.type === 'BloodPressure' ? 'Systolic Value *' : 'Value *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 120"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                  />
                </div>

                {vitalConfigs[form.type]?.hasDiastolic && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Diastolic Value *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 80"
                      value={form.value2}
                      onChange={(e) => setForm({ ...form, value2: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Taken after 10 mins rest"
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
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientVitals;
