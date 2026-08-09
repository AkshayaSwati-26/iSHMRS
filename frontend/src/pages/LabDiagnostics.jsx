import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  Activity,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  TestTube,
  Flame,
  CheckCheck
} from 'lucide-react';

const LabDiagnostics = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'catalog'
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const socket = useSocket();

  // New Order Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    testIds: [],
    priority: 'Routine',
    notes: ''
  });

  // Result Entry Modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultItems, setResultItems] = useState([]);

  const fetchOrders = async () => {
    try {
      const searchQ = search ? `?search=${search}` : '';
      const [ordersRes, catalogRes] = await Promise.all([
        api.get(`/lab/orders${searchQ}`),
        api.get('/lab/catalog')
      ]);

      if (ordersRes.data.status === 'success') {
        setOrders(ordersRes.data.data.orders);
      }
      if (catalogRes.data.status === 'success') {
        setCatalog(catalogRes.data.data.tests);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lab records');
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
    fetchOrders();
    fetchPatients();
  }, [search]);

  // Socket.io alerts for STAT lab orders and Critical results
  useEffect(() => {
    if (!socket) return;

    socket.on('lab_stat_order', (data) => {
      toast.error(`🔥 STAT LAB ORDER: Order ${data.orderNumber} for ${data.patientName}!`, {
        duration: 8000,
        position: 'top-right'
      });
      fetchOrders();
    });

    socket.on('lab_critical_alert', (data) => {
      toast.error(`🚨 CRITICAL LAB RESULT: ${data.patientName} (${data.orderNumber})`, {
        duration: 10000,
        position: 'top-center'
      });
      fetchOrders();
    });

    return () => {
      socket.off('lab_stat_order');
      socket.off('lab_critical_alert');
    };
  }, [socket]);

  const handleCollectSample = async (orderId) => {
    try {
      const res = await api.put(`/lab/orders/${orderId}/collect`);
      if (res.data.status === 'success') {
        toast.success('Sample collection logged!');
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to update sample status');
    }
  };

  const handleOpenResultModal = (order) => {
    setSelectedOrder(order);
    setResultItems(
      order.items.map(item => ({
        itemId: item.id,
        testName: item.labTest?.name,
        referenceRange: item.labTest?.referenceRange,
        unit: item.labTest?.unit || '',
        resultValue: item.resultValue || '',
        isAbnormal: item.isAbnormal || false,
        isCritical: item.isCritical || false,
        resultNotes: item.resultNotes || ''
      }))
    );
    setShowResultModal(true);
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/lab/orders/${selectedOrder.id}/results`, { items: resultItems });
      if (res.data.status === 'success') {
        toast.success('Lab test results published!');
        setShowResultModal(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to save lab results');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.patientId || orderForm.testIds.length === 0) {
      toast.error('Select a patient and at least one lab test');
      return;
    }

    try {
      const res = await api.post('/lab/orders', orderForm);
      if (res.data.status === 'success') {
        toast.success('Lab Requisition Order Created!');
        setShowOrderModal(false);
        setOrderForm({ patientId: '', testIds: [], priority: 'Routine', notes: '' });
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to create lab order');
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
    <div className="space-y-6 font-sans">

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lab & Diagnostics Workflow</h1>
          <p className="text-xs font-semibold text-slate-500">Order lab requisitions, log sample collections, and publish critical lab results</p>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Lab Requisition</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TestTube className="h-4 w-4" />
          <span>Lab Requisition Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Test Catalog ({catalog.length})</span>
        </button>
      </div>

      {/* TAB 1: Lab Requisition Queue */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order #, Patient Name, or UHID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium outline-none shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="glass-panel rounded-3xl p-5 border border-slate-200 bg-white space-y-3 shadow-xs">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">{order.orderNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.priority === 'STAT' ? 'bg-rose-500 text-white animate-pulse' :
                        order.priority === 'Urgent' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.priority}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.status === 'Resulted' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'SampleCollected' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mt-1">
                      Patient: {order.patient?.name} ({order.patient?.uhid}) · {order.patient?.gender}, {order.patient?.age} yrs
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ordered By: Dr. {order.orderedBy?.firstName} {order.orderedBy?.lastName} on {new Date(order.orderedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {order.status === 'Ordered' && (
                      <button
                        onClick={() => handleCollectSample(order.id)}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs cursor-pointer shadow-xs"
                      >
                        Mark Sample Collected
                      </button>
                    )}

                    {order.status !== 'Resulted' && (
                      <button
                        onClick={() => handleOpenResultModal(order)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs cursor-pointer shadow-xs"
                      >
                        Enter Results
                      </button>
                    )}
                  </div>
                </div>

                {/* Ordered Test Items */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        item.isCritical ? 'bg-rose-50 border-rose-300 text-rose-800' :
                        item.isAbnormal ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {item.labTest?.name}
                      {item.resultValue && (
                        <span className="ml-2 font-black text-teal-800">
                          = {item.resultValue} {item.labTest?.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Catalog */}
      {activeTab === 'catalog' && (
        <div className="glass-panel rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="p-4">Code</th>
                <th className="p-4">Test Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Sample Type</th>
                <th className="p-4">Reference Range</th>
                <th className="p-4 text-right">Price (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {catalog.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="p-4 font-black text-slate-800">{t.code}</td>
                  <td className="p-4 font-bold text-slate-900">{t.name}</td>
                  <td className="p-4 text-teal-700 font-bold">{t.category}</td>
                  <td className="p-4 text-slate-600">{t.sampleType}</td>
                  <td className="p-4 text-slate-600">{t.referenceRange}</td>
                  <td className="p-4 text-right font-black text-slate-900">₹{t.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result Entry Modal */}
      {showResultModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800">Enter Lab Results</h3>
                <p className="text-xs text-slate-500">{selectedOrder.orderNumber} · {selectedOrder.patient?.name}</p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveResults} className="space-y-4">
              {resultItems.map((item, idx) => (
                <div key={item.itemId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-extrabold text-slate-800 text-xs">
                    <span>{item.testName}</span>
                    <span className="text-slate-500 font-normal">Ref Range: {item.referenceRange}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Result Value"
                      value={item.resultValue}
                      onChange={(e) => {
                        const updated = [...resultItems];
                        updated[idx].resultValue = e.target.value;
                        setResultItems(updated);
                      }}
                      className="col-span-8 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => {
                        const updated = [...resultItems];
                        updated[idx].unit = e.target.value;
                        setResultItems(updated);
                      }}
                      className="col-span-4 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold pt-1">
                    <label className="flex items-center gap-1.5 text-amber-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isAbnormal}
                        onChange={(e) => {
                          const updated = [...resultItems];
                          updated[idx].isAbnormal = e.target.checked;
                          setResultItems(updated);
                        }}
                        className="h-4 w-4 text-amber-600 rounded"
                      />
                      <span>Abnormal Value</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-rose-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isCritical}
                        onChange={(e) => {
                          const updated = [...resultItems];
                          updated[idx].isCritical = e.target.checked;
                          if (e.target.checked) updated[idx].isAbnormal = true;
                          setResultItems(updated);
                        }}
                        className="h-4 w-4 text-rose-600 rounded"
                      />
                      <span>🚨 CRITICAL VALUE</span>
                    </label>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Publish Lab Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">New Lab Requisition Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Patient *</label>
                <select
                  value={orderForm.patientId}
                  onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Priority Level</label>
                <select
                  value={orderForm.priority}
                  onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT (Immediate Emergency)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Lab Tests *</label>
                <div className="max-h-40 overflow-y-auto space-y-1 p-1 border border-slate-200 rounded-xl">
                  {catalog.map(t => {
                    const isChecked = orderForm.testIds.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOrderForm({ ...orderForm, testIds: [...orderForm.testIds, t.id] });
                            } else {
                              setOrderForm({ ...orderForm, testIds: orderForm.testIds.filter(id => id !== t.id) });
                            }
                          }}
                          className="h-4 w-4 text-teal-600 rounded"
                        />
                        <span>{t.name} (₹{t.price})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LabDiagnostics;
