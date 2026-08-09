import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Printer,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Building,
  User
} from 'lucide-react';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({ todayCollected: 0, totalCollected: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // New Bill Form
  const [billType, setBillType] = useState('OPD'); // OPD or IPD
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: '',
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
    items: [{ description: 'Consultation Fee', quantity: 1, unitPrice: 500, type: 'Consultation' }]
  });

  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');

  const fetchBills = async () => {
    try {
      const searchQ = search ? `?search=${search}` : '';
      const [billsRes, statsRes] = await Promise.all([
        api.get(`/billing${searchQ}`),
        api.get('/billing/stats')
      ]);

      if (billsRes.data.status === 'success') {
        setBills(billsRes.data.data.bills);
      }
      if (statsRes.data.status === 'success') {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      if (res.data.status === 'success') {
        setPatients(res.data.data.patients || res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchPatients();
  }, [search]);

  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unitPrice: 0, type: 'Procedure' }]
    });
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!form.patientId) {
      toast.error('Please select a patient');
      return;
    }

    try {
      const endpoint = billType === 'OPD' ? '/billing/opd' : '/billing/ipd';
      const res = await api.post(endpoint, form);
      if (res.data.status === 'success') {
        toast.success(`${billType} Invoice Generated!`);
        setShowCreateModal(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Enter valid payment amount');
      return;
    }

    try {
      const res = await api.post(`/billing/${selectedBill.id}/payment`, {
        amount: parseFloat(payAmount),
        method: payMethod,
        referenceNumber: payRef
      });

      if (res.data.status === 'success') {
        toast.success('Payment transaction recorded!');
        setShowPaymentModal(false);
        setPayAmount('');
        fetchBills();
      }
    } catch (err) {
      toast.error('Payment processing failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Today's Collections</span>
            <div className="text-xl font-black text-emerald-900">₹{stats.todayCollected.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-indigo-200 bg-indigo-50/50 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Total Revenue Collected</span>
            <div className="text-xl font-black text-indigo-900">₹{stats.totalCollected.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-amber-200 bg-amber-50/50 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Outstanding Dues</span>
            <div className="text-xl font-black text-amber-900">₹{stats.totalPending.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice by Bill #, Patient Name, or UHID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-indigo-500 shadow-xs"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Bills Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Patient UHID & Name</th>
                <th className="p-4">Date Generated</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Paid / Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/70 transition-all">
                  <td className="p-4 font-black text-slate-800">{bill.billNumber}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{bill.patient?.name}</div>
                    <div className="text-[10px] text-slate-500">{bill.patient?.uhid}</div>
                  </td>
                  <td className="p-4 text-slate-600">{new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 font-black text-slate-900">₹{bill.totalAmount.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="text-emerald-700 font-bold">Paid: ₹{bill.paidAmount.toLocaleString()}</div>
                    {bill.balanceAmount > 0 && (
                      <div className="text-amber-700 font-bold text-[11px]">Due: ₹{bill.balanceAmount.toLocaleString()}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                      bill.status === 'PartiallyPaid' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {bill.balanceAmount > 0 && (
                      <button
                        onClick={() => { setSelectedBill(bill); setShowPaymentModal(true); }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200 cursor-pointer"
                      >
                        Add Payment
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      title="Print Invoice"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800">Record Payment</h3>
                <p className="text-xs text-slate-500">{selectedBill.billNumber} · {selectedBill.patient?.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between font-bold">
                <span>Remaining Balance Due:</span>
                <span>₹{selectedBill.balanceAmount.toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  max={selectedBill.balanceAmount}
                  placeholder={`Max ₹${selectedBill.balanceAmount}`}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Insurance">Insurance TPA Settlement</option>
                  <option value="NetBanking">Net Banking</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="Optional UPI Ref or Auth Code"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">Generate New Hospital Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setBillType('OPD')}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer ${billType === 'OPD' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'}`}
              >
                OPD Outpatient Bill
              </button>
              <button
                type="button"
                onClick={() => setBillType('IPD')}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer ${billType === 'IPD' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'}`}
              >
                IPD Inpatient Bill
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Patient *</label>
                <select
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...form.items];
                        updated[idx].description = e.target.value;
                        setForm({ ...form, items: updated });
                      }}
                      className="col-span-6 px-2.5 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...form.items];
                        updated[idx].quantity = parseInt(e.target.value) || 1;
                        setForm({ ...form, items: updated });
                      }}
                      className="col-span-2 px-2 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...form.items];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setForm({ ...form, items: updated });
                      }}
                      className="col-span-4 px-2.5 py-2 rounded-xl border border-slate-200 text-xs outline-none font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">GST / Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={form.taxAmount}
                    onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
