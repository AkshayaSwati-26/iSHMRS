import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Stethoscope,
  Pill,
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Zap
} from 'lucide-react';

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState('chatbot'); // 'chatbot', 'diagnosis', 'drug', 'discharge'

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your iSHRMS AI Clinical Co-Pilot. Ask me about patient triaging, ward bed availability, OPD queues, or drug interactions!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Diagnosis Assist State
  const [diagForm, setDiagForm] = useState({ symptoms: '', vitals: 'BP: 130/85, HR: 88, SpO2: 97%, Temp: 99.2F', medicalHistory: 'Hypertension' });
  const [diagResult, setDiagResult] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Drug Interaction State
  const [drugInput, setDrugInput] = useState('Aspirin, Warfarin, Metformin');
  const [drugResult, setDrugResult] = useState(null);
  const [drugLoading, setDrugLoading] = useState(false);

  // Send Chatbot Message
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chatbot', { message: userText });
      if (res.data.status === 'success') {
        setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.data.reply }]);
      }
    } catch (err) {
      toast.error('AI assistant failed to respond');
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I ran into an issue connecting to the AI engine. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Run Diagnosis Assist
  const handleDiagnosisAssist = async (e) => {
    e.preventDefault();
    if (!diagForm.symptoms) {
      toast.error('Please enter patient symptoms');
      return;
    }

    setDiagLoading(true);
    try {
      const res = await api.post('/ai/diagnosis-assist', diagForm);
      if (res.data.status === 'success') {
        setDiagResult(res.data.data.assist);
      }
    } catch (err) {
      toast.error('AI Diagnosis assist failed');
    } finally {
      setDiagLoading(false);
    }
  };

  // Run Drug Interaction
  const handleDrugCheck = async (e) => {
    e.preventDefault();
    if (!drugInput) return;

    setDrugLoading(true);
    try {
      const medicines = drugInput.split(',').map(m => m.trim());
      const res = await api.post('/ai/drug-interaction', { medicines });
      if (res.data.status === 'success') {
        setDrugResult(res.data.data.analysis);
      }
    } catch (err) {
      toast.error('Drug interaction check failed');
    } finally {
      setDrugLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-[-5%] top-[-20%] h-64 w-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md border border-white/20 text-indigo-200 tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                POWERED BY GOOGLE GEMINI 1.5
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">iSHRMS AI Clinical Intelligence</h1>
            <p className="text-indigo-200 text-xs sm:text-sm font-medium mt-1">
              AI Decision Support, Drug Interaction Matrix & Hospital Context Co-Pilot
            </p>
          </div>

          <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0">
            <BrainCircuit className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'chatbot', label: 'Hospital NLP Chatbot', icon: Bot },
          { id: 'diagnosis', label: 'Diagnosis Co-Pilot (CDSS)', icon: Stethoscope },
          { id: 'drug', label: 'Drug Interaction Matrix', icon: Pill },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: NLP Chatbot */}
      {activeTab === 'chatbot' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-xs flex flex-col h-[550px]">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-br-none shadow-xs'
                    : 'bg-slate-100 text-slate-800 font-normal rounded-bl-none border border-slate-200/80'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px] opacity-75 uppercase">
                    {msg.sender === 'user' ? 'You' : 'iSHRMS Gemini AI'}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-2xl text-xs text-slate-500 font-bold flex items-center gap-2">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent"></span>
                  <span>Gemini AI is reasoning...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Ask AI e.g. 'What is the bed availability in ICU?' or 'Give differential for chest pain'..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </form>

        </div>
      )}

      {/* TAB 2: Diagnosis Co-Pilot */}
      {activeTab === 'diagnosis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleDiagnosisAssist} className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-800">Clinical Input Parameters</h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Patient Symptoms & Complaints *</label>
              <textarea
                rows="3"
                placeholder="e.g. Acute chest pain radiating to left arm, shortness of breath, sweating for 2 hours..."
                value={diagForm.symptoms}
                onChange={(e) => setDiagForm({ ...diagForm, symptoms: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Current Vitals</label>
              <input
                type="text"
                value={diagForm.vitals}
                onChange={(e) => setDiagForm({ ...diagForm, vitals: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Medical History</label>
              <input
                type="text"
                value={diagForm.medicalHistory}
                onChange={(e) => setDiagForm({ ...diagForm, medicalHistory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={diagLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Zap className="h-4 w-4" />
              <span>{diagLoading ? 'Analyzing via Gemini AI...' : 'Generate AI Differential Diagnosis'}</span>
            </button>
          </form>

          {/* Result Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-800">AI Differential Diagnosis Output</h3>

            {!diagResult ? (
              <div className="py-16 text-center text-xs text-slate-400 font-semibold">
                Enter patient symptoms on the left and click Generate to run AI clinical evaluation.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-extrabold text-slate-800 mb-2 uppercase text-[11px] tracking-wider text-indigo-700">Differential Diagnoses</h4>
                  <div className="space-y-2">
                    {diagResult.differentialDiagnoses?.map((d, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between font-black text-slate-800">
                          <span>{d.condition}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800">{d.icd10Code || 'ICD-10'}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{d.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {diagResult.recommendedLabTests && (
                  <div>
                    <h4 className="font-extrabold text-slate-800 mb-1 uppercase text-[11px] tracking-wider text-indigo-700">Recommended Investigations</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {diagResult.recommendedLabTests.map((t, i) => (
                        <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-200 font-bold text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Drug Interaction Matrix */}
      {activeTab === 'drug' && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-6 shadow-xs max-w-3xl mx-auto">
          <div>
            <h3 className="text-sm font-black text-slate-800">Drug Interaction Checker</h3>
            <p className="text-xs text-slate-500 font-medium">Enter comma-separated drug names to check contraindications</p>
          </div>

          <form onSubmit={handleDrugCheck} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Aspirin, Warfarin, Lisinopril"
              value={drugInput}
              onChange={(e) => setDrugInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={drugLoading}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
            >
              {drugLoading ? 'Checking...' : 'Check Interactions'}
            </button>
          </form>

          {drugResult && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800">Interaction Analysis Result</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  drugResult.severity === 'High' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  Severity: {drugResult.severity || 'Minor'}
                </span>
              </div>

              {drugResult.interactions?.map((item, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-rose-700">{item.drug1} ↔ {item.drug2}</div>
                  <p className="text-slate-600">{item.mechanism}</p>
                  <p className="text-indigo-700 font-semibold">Recommendation: {item.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AIAssistant;
