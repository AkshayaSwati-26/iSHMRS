import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  GitCommit,
  UserPlus,
  Play,
  CheckCircle,
  SkipForward,
  Activity,
  Plus,
  Trash2,
  AlertTriangle,
  Building,
  UserCheck,
  X
} from 'lucide-react';

const OPDQueue = () => {
  const { user, hasRole } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'generate'
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Generate token state
  const [patientId, setPatientId] = useState('');
  const [generateDeptId, setGenerateDeptId] = useState('');
  const [priority, setPriority] = useState('Normal');

  // Consultation state
  const [consultingToken, setConsultingToken] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bp, setBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temp, setTemp] = useState('');
  const [respRate, setRespRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [notes, setNotes] = useState('');
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  
  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRecommendations, setLabRecommendations] = useState([]);
  const [newLabTest, setNewLabTest] = useState('');

  // Fetch departments for dropdowns
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const bedsRes = await api.get('/beds');
      const beds = bedsRes.data.data.beds;
      const uniqueDepts = {};
      beds.forEach(b => {
        const d = b.room.ward.department;
        uniqueDepts[d.id] = d;
      });
      return Object.values(uniqueDepts);
    }
  });

  // Fetch registered patients for token generator
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data.patients;
    }
  });

  // Fetch medicines for prescription dropdown
  const { data: medicinesData } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const res = await api.get('/medicines');
      return res.data.data.medicines;
    }
  });

  // Fetch active queue
  const { data: queueData, isLoading } = useQuery({
    queryKey: ['opdQueue', selectedDeptId],
    queryFn: async () => {
      const res = await api.get(`/opd/queue${selectedDeptId ? `?departmentId=${selectedDeptId}` : ''}`);
      return res.data.data.queue;
    }
  });

  // Socket triggers for real-time queue refreshing
  useEffect(() => {
    if (!socket) return;

    const refreshQueue = () => {
      queryClient.invalidateQueries(['opdQueue']);
    };

    socket.on('token_generated', refreshQueue);
    socket.on('token_called', refreshQueue);
    socket.on('token_completed', refreshQueue);

    return () => {
      socket.off('token_generated', refreshQueue);
      socket.off('token_called', refreshQueue);
      socket.off('token_completed', refreshQueue);
    };
  }, [socket, queryClient]);

  // Mutations
  const generateTokenMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/opd/token', payload);
      return res.data.data.opdToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opdQueue']);
      toast.success('OPD Token generated successfully!');
      setPatientId('');
      setGenerateDeptId('');
      setPriority('Normal');
      setActiveTab('queue');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Token generation failed');
    }
  });

  const callNextMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/opd/call-next', payload);
      return res.data.data.opdToken;
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries(['opdQueue']);
      if (token) {
        toast.success(`Called Token #${token.tokenNumber} (${token.patient.name})`);
        setConsultingToken(token);
      } else {
        toast.warn('No patients waiting in queue');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Call next failed');
    }
  });

  const skipTokenMutation = useMutation({
    mutationFn: async (tokenId) => {
      const res = await api.post(`/opd/token/${tokenId}/skip`);
      return res.data.data.opdToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opdQueue']);
      toast.success('Token marked as skipped / no show');
      setConsultingToken(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Skip operation failed');
    }
  });

  const addConsultationMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/consultations', payload);
      return res.data.data.consultation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opdQueue']);
      toast.success('Consultation record saved successfully!');
      setConsultingToken(null);
      // Reset consultation fields
      setSymptoms('');
      setDiagnosis('');
      setBp('');
      setHeartRate('');
      setTemp('');
      setRespRate('');
      setSpo2('');
      setNotes('');
      setAdmissionRecommended(false);
      setPrescriptions([]);
      setLabRecommendations([]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to save consultation');
    }
  });

  const handleCallNext = () => {
    if (!selectedDeptId) {
      toast.error('Select a specific department queue first');
      return;
    }
    callNextMutation.mutate({ departmentId: selectedDeptId });
  };

  const handleGenerateToken = (e) => {
    e.preventDefault();
    if (!patientId || !generateDeptId) {
      toast.error('Patient and department are mandatory');
      return;
    }
    generateTokenMutation.mutate({
      patientId,
      departmentId: generateDeptId,
      priority
    });
  };

  // Prescription list helper
  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { medicineId: '', name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removePrescriptionRow = (idx) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handlePrescriptionMedicineChange = (idx, medId) => {
    const med = medicinesData.find(m => m.id === medId);
    const updated = [...prescriptions];
    updated[idx].medicineId = medId;
    updated[idx].name = med ? med.name : '';
    setPrescriptions(updated);
  };

  const handlePrescriptionTextChange = (idx, field, val) => {
    const updated = [...prescriptions];
    updated[idx][field] = val;
    setPrescriptions(updated);
  };

  const addLabTest = () => {
    if (newLabTest.trim()) {
      setLabRecommendations([...labRecommendations, newLabTest.trim()]);
      setNewLabTest('');
    }
  };

  const removeLabTest = (idx) => {
    setLabRecommendations(labRecommendations.filter((_, i) => i !== idx));
  };

  const handleSaveConsultation = (e) => {
    e.preventDefault();
    if (!symptoms || !diagnosis) {
      toast.error('Symptoms and Diagnosis are required');
      return;
    }
    addConsultationMutation.mutate({
      tokenId: consultingToken.id,
      patientId: consultingToken.patientId,
      symptoms,
      diagnosis,
      vitals: {
        bp,
        heartRate: heartRate ? parseInt(heartRate) : null,
        temp: temp ? parseFloat(temp) : null,
        respRate: respRate ? parseInt(respRate) : null,
        spo2: spo2 ? parseInt(spo2) : null
      },
      prescriptions: prescriptions.filter(p => p.medicineId),
      labRecommendations,
      admissionRecommended,
      notes
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">OPD Queue & Consultations</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time queuing engine and patient diagnosis records</p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'queue' && hasRole(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']) && (
            <button
              onClick={handleCallNext}
              disabled={callNextMutation.isPending || !!consultingToken}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/10 text-xs font-bold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span>Call Next Patient</span>
            </button>
          )}

          {hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
            <button
              onClick={() => setActiveTab(activeTab === 'queue' ? 'generate' : 'queue')}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 text-xs font-bold text-white rounded-xl transition-all duration-200"
            >
              <UserPlus className="h-4 w-4" />
              <span>{activeTab === 'queue' ? 'Issue Token' : 'View Queue'}</span>
            </button>
          )}
        </div>
      </div>

      {consultingToken ? (
        /* Active Consultation Sheet */
        <div className="glass-panel border-slate-200/85 rounded-3xl p-6 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-600 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Active Consultation: Token #{consultingToken.tokenNumber} ({consultingToken.patient.name})
              </h3>
            </div>
            <button
              onClick={() => skipTokenMutation.mutate(consultingToken.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-500 hover:bg-rose-50"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Skip / No Show</span>
            </button>
          </div>

          <form onSubmit={handleSaveConsultation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Symptoms & Diagnosis */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Symptoms *</label>
                  <textarea
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Chief complaints, pain levels, duration..."
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white h-24 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Diagnosis *</label>
                  <textarea
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Clinical findings, ICD-10 codes, medical condition..."
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white h-24 outline-none"
                  />
                </div>
              </div>

              {/* Patient Vitals */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Vitals Monitoring</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</label>
                    <input type="text" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80 mmHg" className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-slate-800 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate (bpm)</label>
                    <input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="72" className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-slate-800 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Temperature (°F)</label>
                    <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="98.6" className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-slate-800 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SpO2 (%)</label>
                    <input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="98" className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-slate-800 bg-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Respiratory Rate (breaths/min)</label>
                  <input type="number" value={respRate} onChange={(e) => setRespRate(e.target.value)} placeholder="16" className="w-full glass-input px-3 py-2.5 rounded-lg text-xs text-slate-800 bg-white" />
                </div>
              </div>
            </div>

            {/* Prescriptions */}
            <div className="border-t border-slate-200/60 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Prescribed Medications</h4>
                <button
                  type="button"
                  onClick={addPrescriptionRow}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-600 border border-indigo-200 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-xs">No medicines prescribed.</div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((row, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 w-full">
                      <select
                        required
                        value={row.medicineId}
                        onChange={(e) => handlePrescriptionMedicineChange(idx, e.target.value)}
                        className="w-full sm:flex-1 glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      >
                        <option value="">Select Medicine</option>
                        {medicinesData?.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (Batch: {m.batchNumber})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={row.dosage}
                        onChange={(e) => handlePrescriptionTextChange(idx, 'dosage', e.target.value)}
                        placeholder="Dosage (e.g. 1 tab)"
                        className="w-full sm:w-40 glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      />
                      <input
                        type="text"
                        required
                        value={row.frequency}
                        onChange={(e) => handlePrescriptionTextChange(idx, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g. 1-0-1)"
                        className="w-full sm:w-40 glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      />
                      <input
                        type="text"
                        required
                        value={row.duration}
                        onChange={(e) => handlePrescriptionTextChange(idx, 'duration', e.target.value)}
                        placeholder="Duration (e.g. 5 days)"
                        className="w-full sm:w-40 glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removePrescriptionRow(idx)}
                        className="p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lab Recommendations & Admissions */}
            <div className="border-t border-slate-200/60 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Lab Recs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Lab & Diagnostic Requests</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabTest}
                    onChange={(e) => setNewLabTest(e.target.value)}
                    placeholder="e.g. CBC, Lipid Profile, Chest X-Ray"
                    className="flex-1 glass-input px-3 py-2.5 rounded-xl text-xs text-slate-850 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addLabTest}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl"
                  >
                    Add Test
                  </button>
                </div>
                {labRecommendations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {labRecommendations.map((test, i) => (
                      <span key={i} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-indigo-50 text-[10px] text-indigo-600 border border-indigo-150 font-bold">
                        <span>{test}</span>
                        <button type="button" onClick={() => removeLabTest(i)} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Admissions recommendations & notes */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Inpatient Admissions</h4>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={admissionRecommended}
                    onChange={(e) => setAdmissionRecommended(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-350 bg-white text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Recommend Patient Admission</span>
                    <span className="text-[10px] text-slate-500">Requires emergency ward allocation or ICU booking</span>
                  </div>
                </label>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Consultation Notes / Remarks</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="General comments or instructions..." className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-850 bg-white" />
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setConsultingToken(null)}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-xs font-bold text-slate-500"
              >
                Put back on hold
              </button>
              <button
                type="submit"
                disabled={addConsultationMutation.isPending}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 transition-all text-xs font-bold text-white rounded-xl shadow-md"
              >
                {addConsultationMutation.isPending ? 'Saving Record...' : 'Complete Consultation'}
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'generate' ? (
        /* Issue Token / Queue Entry form */
        <div className="glass-panel border-slate-200/80 rounded-3xl p-6 max-w-xl mx-auto shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200/60 pb-4 mb-6">
            <GitCommit className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">OPD Token Ticket Generator</h3>
          </div>
          <form onSubmit={handleGenerateToken} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Select Patient Profile *</label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full glass-input px-4 py-3.5 rounded-xl text-xs text-slate-800 bg-white"
              >
                <option value="">Choose Patient</option>
                {patientsData?.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Medical Department *</label>
                <select
                  required
                  value={generateDeptId}
                  onChange={(e) => setGenerateDeptId(e.target.value)}
                  className="w-full glass-input px-4 py-3.5 rounded-xl text-xs text-slate-800 bg-white"
                >
                  <option value="">Select Specialty</option>
                  {deptsData?.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Queue Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full glass-input px-4 py-3.5 rounded-xl text-xs text-slate-800 bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="SeniorCitizen">Senior Citizen Priority</option>
                  <option value="Pregnancy">Pregnancy Priority</option>
                  <option value="Emergency">Emergency Case (First)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generateTokenMutation.isPending}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white rounded-xl shadow-md"
              >
                {generateTokenMutation.isPending ? 'Issuing...' : 'Generate Token'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Queue View Board */
        <div className="space-y-6">
          {/* Department Filter Header */}
          <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Filter:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs outline-none focus:border-indigo-500/60 font-semibold"
            >
              <option value="">All Departments</option>
              {deptsData?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Queue Listing Grid */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-450 animate-pulse text-xs">Loading queue telemetry...</div>
          ) : queueData.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
              <GitCommit className="h-10 w-10 text-slate-300" />
              <span>No active tokens in the queue.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queueData.map((token) => (
                <div
                  key={token.id}
                  className={`glass-panel border rounded-3xl p-5 relative overflow-hidden transition-all duration-300 shadow-sm hover:scale-[1.02] hover:-translate-y-1 ${
                    token.status === 'InConsultation'
                      ? 'border-emerald-500/40 bg-emerald-50/50 shadow-md hover:shadow-emerald-500/10'
                      : 'border-slate-200/80 hover:border-indigo-500/30 bg-white hover:shadow-indigo-500/10'
                  }`}
                >
                  {/* Priority indicator stripe */}
                  {token.priority === 'Emergency' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>}
                  {token.priority === 'SeniorCitizen' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>}
                  {token.priority === 'Pregnancy' && <div className="absolute top-0 left-0 right-0 h-1.5 bg-pink-500"></div>}

                  {/* Queue Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black font-mono border ${
                        token.status === 'InConsultation'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-150'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-150'
                      }`}>
                        #{token.tokenNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">{token.patient.uhid}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                      token.priority === 'Emergency' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      token.priority === 'SeniorCitizen' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      token.priority === 'Pregnancy' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {token.priority}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-1 mb-6">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{token.patient.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">Age: {token.patient.age} / Gender: {token.patient.gender}</p>
                    <p className="text-[10px] text-indigo-600 font-black flex items-center gap-1 mt-1.5 uppercase">
                      <Building className="h-3 w-3 text-indigo-400" />
                      <span>{token.department.name}</span>
                    </p>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        token.status === 'InConsultation' ? 'bg-emerald-500 animate-pulse' :
                        token.status === 'Waiting' ? 'bg-yellow-500' :
                        'bg-slate-400'
                      }`}></span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{token.status.replace(/([A-Z])/g, ' $1')}</span>
                    </div>

                    {/* Action button conditional rendering */}
                    {hasRole(['SUPER_ADMIN', 'ADMIN', 'DOCTOR']) && (
                      token.status === 'Waiting' ? (
                        <button
                          onClick={() => callNextMutation.mutate({ departmentId: token.departmentId })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-all duration-200 shadow-sm"
                        >
                          <Play className="h-3 w-3" />
                          <span>Call Next</span>
                        </button>
                      ) : token.status === 'InConsultation' && (
                        <div className="flex gap-1.5">
                          {/* If current doctor called the token, show Consult button */}
                          {(!token.doctorId || token.doctorId === user.id) && (
                            <button
                              onClick={() => setConsultingToken(token)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition-all duration-200 shadow-sm"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Consult</span>
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OPDQueue;
export { OPDQueue };
