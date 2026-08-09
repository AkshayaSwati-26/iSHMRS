import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FolderOpen, Upload, Trash2, FileText, Download, Eye } from 'lucide-react';

const PatientDocumentVault = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'LabReport',
    fileUrl: '',
    notes: ''
  });

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/patient-portal/documents');
      if (res.data.status === 'success') {
        setDocuments(res.data.data.documents);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load document vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({
        ...form,
        name: file.name,
        fileUrl: reader.result,
        mimeType: file.type,
        fileSize: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.fileUrl) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      const res = await api.post('/patient-portal/documents', form);
      if (res.data.status === 'success') {
        toast.success('Document uploaded successfully!');
        setShowModal(false);
        setForm({ name: '', type: 'LabReport', fileUrl: '', notes: '' });
        fetchDocuments();
      }
    } catch (err) {
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document from your vault?')) return;

    try {
      const res = await api.delete(`/patient-portal/documents/${id}`);
      if (res.data.status === 'success') {
        toast.success('Document deleted');
        fetchDocuments();
      }
    } catch (err) {
      toast.error('Failed to delete document');
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Personal Medical Vault</h1>
          <p className="text-xs font-semibold text-slate-500">Securely store lab reports, X-rays, insurance policies & old prescriptions</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center rounded-3xl border border-slate-200">
            <FolderOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Medical vault is empty</h3>
            <p className="text-xs text-slate-500 mt-1">Upload reports, diagnostic scans, and medical bills to access anytime.</p>
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white space-y-3 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-50 text-teal-800 border border-teal-200">
                    {doc.type}
                  </span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="text-sm font-black text-slate-800 mt-2 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
                {doc.notes && (
                  <p className="text-xs text-slate-600 mt-1 italic font-sans">{doc.notes}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">Upload Medical Document</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Document Category *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="LabReport">Lab Test Report</option>
                  <option value="Radiology">Radiology Scan (X-Ray/CT/MRI)</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Insurance">Insurance Policy</option>
                  <option value="Discharge">Discharge Summary</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select File (Max 5MB PDF/Image) *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Document Title / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Blood Test Report July 2026"
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
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDocumentVault;
