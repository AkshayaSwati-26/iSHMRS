import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  FileBarChart, 
  FileText, 
  Download, 
  Plus, 
  Clock, 
  User, 
  RefreshCw,
  Search,
  CheckCircle,
  FileDown
} from 'lucide-react';

const Reports = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('OPD_Performance');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch reports list
  const { data: reports, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get('/reports');
      return res.data.data.reports;
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (newReport) => {
      const res = await api.post('/reports', newReport);
      return res.data.data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success('Report generation request queued successfully!');
      setTitle('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to generate report');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a descriptive report title');
      return;
    }
    generateReportMutation.mutate({ title, type });
  };

  const handleDownload = (report) => {
    toast.success(`Preparing PDF download: ${report.title}`);
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob([
        `=== iSHRMS SYSTEM REPORT ===\n\nTitle: ${report.title}\nType: ${report.type}\nGenerated At: ${new Date(report.createdAt).toLocaleString()}\nFile URL: ${report.fileUrl}\n\n[This is a mock PDF report generated for clinical validation. In a production build, this downloads an actual compiled PDF report.]`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${report.type.toLowerCase()}-report-${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Download complete!');
    }, 1000);
  };

  const getTypeStyle = (reportType) => {
    switch (reportType) {
      case 'OPD_Performance': 
        return 'bg-indigo-50 text-indigo-655 border border-indigo-150';
      case 'Bed_Occupancy': 
        return 'bg-emerald-50 text-emerald-655 border border-emerald-150';
      case 'Inventory_Status': 
        return 'bg-amber-50 text-amber-655 border border-amber-150';
      case 'Audit_Log': 
        return 'bg-rose-50 text-rose-655 border border-rose-150';
      default: 
        return 'bg-slate-50 text-slate-500 border border-slate-200';
    }
  };

  const filteredReports = reports?.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Motion configurations
  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Analytical Reports & Audits</h2>
          <p className="text-sm text-slate-500 mt-1">Compile clinic performance datasets, bed turnover speeds, and pharmacy logs</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-505 hover:text-slate-800 transition-all duration-200 flex items-center justify-center disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Compiler Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass-panel border-slate-200/80 rounded-3xl p-6 h-fit space-y-6 shadow-sm bg-white"
        >
          <div className="flex items-center gap-3 border-b border-slate-200/60 pb-4">
            <div className="h-9 w-9 bg-indigo-50 border border-indigo-200 text-indigo-650 flex items-center justify-center rounded-xl">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Compile New Dataset</h3>
              <p className="text-[10px] text-slate-505">Configure report variables</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-505 uppercase">Report Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q2 OPD Patient Wait Times Analysis"
                className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-505 uppercase">Report Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
              >
                <option value="OPD_Performance">OPD Performance & Wait times</option>
                <option value="Bed_Occupancy">Bed Allocation & Room Turnover</option>
                <option value="Inventory_Status">Medicine Stock & Expiry Levels</option>
                <option value="Audit_Log">System-wide Access Audit Trail</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={generateReportMutation.isPending}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {generateReportMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Compiling PDF Report...</span>
                </>
              ) : (
                <>
                  <FileBarChart className="h-4 w-4" />
                  <span>Generate Report</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Generated Reports List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="glass-panel border-slate-200/80 rounded-3xl overflow-hidden shadow-sm bg-white">
            {isLoading ? (
              <div className="p-12 text-center text-slate-450 animate-pulse text-xs">Fetching report records...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-16 text-center text-slate-550 text-xs flex flex-col items-center justify-center gap-3">
                <FileText className="h-10 w-10 text-slate-355" />
                <span>No compiled reports found matching your search.</span>
              </div>
            ) : (
              <motion.div 
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-100"
              >
                {filteredReports.map((report) => (
                  <motion.div 
                    key={report.id} 
                    variants={itemVariants}
                    className="p-5 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex gap-4">
                      <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase ${getTypeStyle(report.type)}`}>
                            {report.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-450 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(report.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-1.5">{report.title}</h4>
                        <p className="text-[10px] text-slate-505 mt-1 flex items-center gap-1 font-semibold">
                          <User className="h-3 w-3 text-indigo-400" />
                          Generated by: {report.generatedBy ? `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : 'System Admin'}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDownload(report)}
                      className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-650 rounded-xl transition-all duration-200 flex items-center gap-1 text-[10px] font-bold shadow-sm cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
export { Reports };
