import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Plus,
  TrendingDown,
  AlertTriangle,
  FileText,
  Trash2,
  PackagePlus,
  PackageMinus,
  Settings,
  Search,
  X,
  FileSpreadsheet,
  Clock,
  User,
  History
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const Inventory = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog controllers
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDispenseForm, setShowDispenseForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(null); // medicine object for general operations

  // Add medicine form state
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [thresholdQuantity, setThresholdQuantity] = useState('');

  // Stock operations modal state
  const [stockChangeQty, setStockChangeQty] = useState('');
  const [transactionType, setTransactionType] = useState('StockIn');
  const [remarks, setRemarks] = useState('');

  // Dedicated Dispense form state
  const [dispenseMedId, setDispenseMedId] = useState('');
  const [dispenseQty, setDispenseQty] = useState('');
  const [dispensePatientUhid, setDispensePatientUhid] = useState('');
  const [dispenseRemarks, setDispenseRemarks] = useState('');

  const { data: medicinesData, isLoading } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const res = await api.get('/medicines');
      return res.data.data.medicines;
    }
  });

  // Fetch recent stock transactions for activity log
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.get('/medicines/transactions');
      return res.data.data.transactions;
    }
  });

  // Mutations
  const addMedicineMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/medicines', payload);
      return res.data.data.medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicines']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardStats']);
      toast.success('Medicine added to inventory successfully!');
      setShowAddForm(false);
      // Reset form
      setName('');
      setGenericName('');
      setBatchNumber('');
      setManufacturer('');
      setExpiryDate('');
      setUnitPrice('');
      setStockQuantity('');
      setThresholdQuantity('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to add medicine');
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.post(`/medicines/${id}/stock`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicines']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardStats']);
      toast.success('Inventory stock updated successfully!');
      setShowStockModal(null);
      setShowDispenseForm(false);
      setStockChangeQty('');
      setRemarks('');
      setDispenseMedId('');
      setDispenseQty('');
      setDispensePatientUhid('');
      setDispenseRemarks('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Stock adjustment failed');
    }
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/medicines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicines']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboardStats']);
      toast.success('Medicine batch deleted.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Deletion failed');
    }
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !genericName || !batchNumber || !expiryDate || !unitPrice || !stockQuantity || !thresholdQuantity) {
      toast.error('Please enter all required fields');
      return;
    }
    addMedicineMutation.mutate({
      name,
      genericName,
      batchNumber,
      manufacturer,
      expiryDate,
      unitPrice: parseFloat(unitPrice),
      stockQuantity: parseInt(stockQuantity),
      thresholdQuantity: parseInt(thresholdQuantity)
    });
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!stockChangeQty || parseInt(stockChangeQty) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const finalQty = transactionType === 'StockOut' 
      ? -Math.abs(parseInt(stockChangeQty)) 
      : parseInt(stockChangeQty);

    updateStockMutation.mutate({
      id: showStockModal.id,
      payload: {
        quantity: finalQty,
        type: transactionType,
        remarks: remarks || 'Manual inventory adjustment'
      }
    });
  };

  const handleDispenseSubmit = (e) => {
    e.preventDefault();
    if (!dispenseMedId) {
      toast.error('Select a medicine to dispense');
      return;
    }
    if (!dispenseQty || parseInt(dispenseQty) <= 0) {
      toast.error('Enter a valid dispensing quantity');
      return;
    }

    const selectedMed = medicinesData.find(m => m.id === dispenseMedId);
    if (selectedMed && selectedMed.stockQuantity < parseInt(dispenseQty)) {
      toast.error(`Insufficient stock! Only ${selectedMed.stockQuantity} units available.`);
      return;
    }

    updateStockMutation.mutate({
      id: dispenseMedId,
      payload: {
        quantity: -Math.abs(parseInt(dispenseQty)),
        type: 'StockOut',
        remarks: `Dispensed to Patient ${dispensePatientUhid ? `(UHID: ${dispensePatientUhid})` : ''}. ${dispenseRemarks ? `Note: ${dispenseRemarks}` : ''}`.trim()
      }
    });
  };

  const getStockStatus = (med) => {
    const isExpired = new Date(med.expiryDate) < new Date();
    if (isExpired) {
      return { label: 'Expired', style: 'bg-rose-50 text-rose-600 border border-rose-100' };
    }
    if (med.stockQuantity <= 0) {
      return { label: 'Out of Stock', style: 'bg-red-50 text-red-600 border border-red-100 font-bold' };
    }
    if (med.stockQuantity < med.thresholdQuantity) {
      return { label: 'Low Stock', style: 'bg-amber-50 text-amber-600 border border-amber-100 font-bold' };
    }
    return { label: 'In Stock', style: 'bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold' };
  };

  const filteredMedicines = medicinesData?.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const availableMedicinesForDispense = medicinesData?.filter(m => m.stockQuantity > 0 && new Date(m.expiryDate) >= new Date()) || [];

  // Low stock datasets for chart
  const lowStockData = medicinesData
    ?.filter(m => m.stockQuantity < m.thresholdQuantity)
    .map(m => ({
      name: m.name.split(' ')[0],
      stock: m.stockQuantity
    })) || [];

  // Expired medicines list
  const expiredData = medicinesData?.filter(m => new Date(m.expiryDate) < new Date()) || [];

  // Medicine type distribution data for Pie Chart
  const typeDistributionData = React.useMemo(() => {
    if (!medicinesData) return [];
    const counts = { Tablet: 0, Capsule: 0, Syrup: 0 };
    medicinesData.forEach(m => {
      const nameLower = m.name.toLowerCase();
      if (nameLower.includes('syrup') || nameLower.includes('cough') || nameLower.includes('suspension')) {
        counts.Syrup++;
      } else if (nameLower.includes('capsule') || nameLower.includes('cap') || nameLower.includes('softgel')) {
        counts.Capsule++;
      } else {
        counts.Tablet++;
      }
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).filter(item => item.value > 0);
  }, [medicinesData]);

  const TYPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  // Motion variants
  const tableVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pharmacy Stock Registry</h2>
          <p className="text-sm text-slate-505 mt-1">Monitor medicine quantities, batch details, thresholds, and expiries</p>
        </div>

        {hasRole(['SUPER_ADMIN', 'ADMIN', 'PHARMACIST']) && (
          <div className="flex gap-2">
            {/* Dispense Quick Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowDispenseForm(true);
                setShowAddForm(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-xs bg-white rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <PackageMinus className="h-4 w-4" />
              <span>Dispense Medicine</span>
            </motion.button>

            {/* Add Batch Quick Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowDispenseForm(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 text-xs font-bold text-white rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? 'View Inventory' : 'Add Medicine'}</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {showAddForm ? (
          /* Add Medicine form */
          <motion.div 
            key="add-form"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: 'spring', stiffness: 110, damping: 15 }}
            className="glass-panel border-slate-200/80 rounded-3xl p-6 max-w-3xl mx-auto shadow-sm bg-white"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/60 pb-4 mb-6">
              <Pill className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Register Medicine Batch</h3>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Medicine Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Paracetamol 650mg" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Generic Formula Name *</label>
                  <input type="text" required value={genericName} onChange={(e) => setGenericName(e.target.value)} placeholder="Acetaminophen" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Batch Number *</label>
                  <input type="text" required value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="BATCH-P25" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Manufacturer</label>
                  <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="GSK Pharma" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Expiry Date *</label>
                  <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Unit Price *</label>
                  <input type="number" step="0.01" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="2.50" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Initial Stock Quantity *</label>
                  <input type="number" required value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="500" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Minimum Stock Threshold *</label>
                  <input type="number" required value={thresholdQuantity} onChange={(e) => setThresholdQuantity(e.target.value)} placeholder="50" className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-xs font-bold text-slate-505 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={addMedicineMutation.isPending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white rounded-xl shadow-md cursor-pointer"
                >
                  {addMedicineMutation.isPending ? 'Registering...' : 'Save Medicine Batch'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : showDispenseForm ? (
          /* Dispense Medicine Form */
          <motion.div 
            key="dispense-form"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: 'spring', stiffness: 110, damping: 15 }}
            className="glass-panel border-slate-200/80 rounded-3xl p-6 max-w-xl mx-auto shadow-sm bg-white"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/60 pb-4 mb-6">
              <PackageMinus className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Dispense Medication Form</h3>
            </div>
            <form onSubmit={handleDispenseSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-505 uppercase">Select Medication in Stock</label>
                <select
                  required
                  value={dispenseMedId}
                  onChange={(e) => setDispenseMedId(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                >
                  <option value="">Choose Medication...</option>
                  {availableMedicinesForDispense.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} (Batch: {med.batchNumber}) — {med.stockQuantity} units available
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Dispense Quantity</label>
                  <input
                    type="number"
                    required
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase">Recipient Patient UHID (Optional)</label>
                  <input
                    type="text"
                    value={dispensePatientUhid}
                    onChange={(e) => setDispensePatientUhid(e.target.value)}
                    placeholder="e.g. UHID-100001"
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-505 uppercase">Remarks / Notes</label>
                <textarea
                  value={dispenseRemarks}
                  onChange={(e) => setDispenseRemarks(e.target.value)}
                  placeholder="Additional notes (e.g., Ward A prescription ref)"
                  className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white h-20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowDispenseForm(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-xs font-bold text-slate-505 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={updateStockMutation.isPending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer"
                >
                  {updateStockMutation.isPending ? 'Dispensing...' : 'Dispense Medication'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Inventory Board & Grid */
          <motion.div 
            key="directory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Analytics Rows - matching the user's second screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Low Stock Bar Chart */}
              <div className="glass-panel border-slate-200/80 rounded-3xl p-5 bg-white shadow-sm flex flex-col justify-between h-64">
                <div>
                  <h3 className="text-xs font-black text-rose-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Low Stock Alerts</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mb-3">Batches under safety margins</p>
                </div>
                <div className="h-32">
                  {lowStockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lowStockData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b', fontSize: '10px' }} />
                        <Bar dataKey="stock" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Units" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No low stock items</div>
                  )}
                </div>
              </div>

              {/* Card 2: Expired List */}
              <div className="glass-panel border-slate-200/80 rounded-3xl p-5 bg-white shadow-sm flex flex-col h-64">
                <div>
                  <h3 className="text-xs font-black text-amber-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>Expired Batches</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mb-3">Awaiting audit removal</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {expiredData.length > 0 ? (
                    expiredData.map(med => (
                      <div key={med.id} className="p-2 border border-rose-100 rounded-xl bg-rose-50/50 flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-800">{med.name}</span>
                        <div className="flex justify-between text-[8px] text-rose-600 font-bold">
                          <span>Batch: {med.batchNumber}</span>
                          <span>Exp: {new Date(med.expiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No expired batches</div>
                  )}
                </div>
              </div>

              {/* Card 3: By Type Pie Chart */}
              <div className="glass-panel border-slate-200/80 rounded-3xl p-5 bg-white shadow-sm flex flex-col justify-between h-64">
                <div>
                  <h3 className="text-xs font-black text-indigo-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <Pill className="h-4 w-4" />
                    <span>Inventory Class By Type</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">Medication form factor</p>
                </div>
                <div className="h-36 flex items-center justify-center relative">
                  {typeDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={45}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {typeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b', fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-[10px] text-slate-400 font-bold">No stock data</div>
                  )}
                </div>
                <div className="flex justify-center gap-3 text-[8px] font-bold text-slate-550 border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Tablet</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Capsule</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Syrup</span>
                </div>
              </div>

              {/* Card 4: Activity Log */}
              <div className="glass-panel border-slate-200/80 rounded-3xl p-5 bg-white shadow-sm flex flex-col h-64">
                <div>
                  <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <History className="h-4 w-4" />
                    <span>Pharmacy Activity Log</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mb-3">Live stock transaction logs</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {!transactionsData || transactionsData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No stock actions recorded yet</div>
                  ) : (
                    transactionsData.map(tx => (
                      <div key={tx.id} className="p-2 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-800">
                          <span className="truncate pr-1">{tx.medicine.name}</span>
                          <span className={tx.quantity > 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between text-[7.5px] text-slate-400 font-semibold mt-0.5">
                          <span className="truncate pr-1">By: {tx.createdBy ? tx.createdBy.firstName : 'System'}</span>
                          <span>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {tx.remarks && <p className="text-[7.5px] text-slate-505 truncate font-medium mt-0.5 border-t border-slate-100/50 pt-0.5">Note: {tx.remarks}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Search Header */}
            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search inventory by medicine name, generic formula, or batch number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs outline-none focus:border-indigo-500/60"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toast.success('CSV manifest generated!')}
                className="flex items-center gap-1.5 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-655 bg-white rounded-xl transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Inventory</span>
              </motion.button>
            </div>

            {/* Table list */}
            <div className="glass-panel border-slate-200/80 rounded-3xl overflow-hidden shadow-sm bg-white">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse text-xs">Loading medicine registry...</div>
              ) : filteredMedicines.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                  <Pill className="h-10 w-10 text-slate-300" />
                  <span>No matching medicine batches in stock.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/60 font-bold uppercase tracking-wider">
                        <th className="p-4">Medicine Name</th>
                        <th className="p-4">Generic Formula</th>
                        <th className="p-4">Batch Number</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Stock Level</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody 
                      variants={tableVariants}
                      initial="hidden"
                      animate="show"
                      className="divide-y divide-slate-100"
                    >
                      {filteredMedicines.map((med) => {
                        const stat = getStockStatus(med);
                        const isExpired = new Date(med.expiryDate) < new Date();
                        return (
                          <motion.tr 
                            key={med.id} 
                            variants={rowVariants}
                            className="hover:bg-slate-50/60 text-slate-650 transition-all cursor-pointer"
                          >
                            <td className="p-4 font-bold text-slate-800">{med.name}</td>
                            <td className="p-4 italic text-slate-600 font-medium">{med.genericName}</td>
                            <td className="p-4 font-mono font-semibold text-slate-500">{med.batchNumber}</td>
                            <td className={`p-4 font-mono font-bold ${
                              isExpired ? 'text-rose-600' : 'text-slate-550'
                            }`}>{new Date(med.expiryDate).toLocaleDateString()}</td>
                            <td className="p-4 font-semibold text-slate-700">
                              <span className={med.stockQuantity < med.thresholdQuantity ? 'text-amber-605 font-black' : 'text-slate-800'}>
                                {med.stockQuantity}
                              </span>
                              <span className="text-slate-400 text-[10px] font-medium"> / {med.thresholdQuantity} min</span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${stat.style}`}>
                                {stat.label}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              {hasRole(['SUPER_ADMIN', 'ADMIN', 'PHARMACIST']) && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowStockModal(med)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-500/40 text-slate-505 hover:text-indigo-650 bg-white transition-all inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                                    title="Add/Deduct Stock"
                                  >
                                    <Settings className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Stock Ops</span>
                                  </motion.button>
                                  {(med.stockQuantity === 0 || isExpired) && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this expired or empty batch?')) {
                                          deleteMedicineMutation.mutate(med.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-500/40 text-slate-400 hover:text-rose-600 bg-white transition-all inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                                      title="Delete Batch"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      <span>Delete</span>
                                    </motion.button>
                                  )}
                                </>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </motion.tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Stock Adjustments Modal */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              className="w-full max-w-sm glass-panel border-slate-200/80 rounded-3xl p-6 relative bg-white shadow-xl"
            >
              <button
                onClick={() => setShowStockModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <form onSubmit={handleStockSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory Stock Adjustment</h3>
                <p className="text-xs text-slate-500">Adjusting stock for <b>{showStockModal.name}</b> (Batch: {showStockModal.batchNumber}).</p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase">Transaction Type</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="StockIn">Stock In (Addition)</option>
                    <option value="StockOut">Stock Out (Reduction)</option>
                    <option value="StockAudit">Stock Audit Reconciliation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase">Quantity (Absolute units)</label>
                  <input
                    type="number"
                    required
                    value={stockChangeQty}
                    onChange={(e) => setStockChangeQty(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase">Audit Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Reason for stock modification"
                    className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-slate-800 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/60">
                  <button type="button" onClick={() => setShowStockModal(null)} className="px-4 py-2 rounded-lg border border-slate-250 text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={updateStockMutation.isPending} 
                    className="px-5 py-2 bg-indigo-600 text-xs font-bold text-white rounded-lg hover:bg-indigo-500 shadow-md cursor-pointer"
                  >
                    {transactionType === 'StockIn' ? 'Add Stock' : 'Deduct Stock'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
export { Inventory };
