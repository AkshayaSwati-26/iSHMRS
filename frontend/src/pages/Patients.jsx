import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Search,
  Calendar,
  Contact,
  MapPin,
  Heart,
  QrCode,
  Printer,
  X,
  FileSpreadsheet
} from 'lucide-react';

const Patients = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showRegForm, setShowRegForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Selected patient for QR ticket modal
  const [selectedPatientTicket, setSelectedPatientTicket] = useState(null);

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients');
      return res.data.data.patients;
    }
  });

  const registerPatientMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/patients', payload);
      return res.data.data.patient;
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries(['patients']);
      toast.success('Patient registered successfully!');
      setSelectedPatientTicket(newPatient); // Open ticket dialog
      // Reset form
      setName('');
      setAge('');
      setGender('Male');
      setBloodGroup('O+');
      setPhone('');
      setAddress('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setShowRegForm(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !age || !gender) {
      toast.error('Name, Age, and Gender are required');
      return;
    }
    registerPatientMutation.mutate({
      name,
      age: parseInt(age),
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContactName,
      emergencyContactPhone
    });
  };

  const filteredPatients = patientsData?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery))
  ) || [];

  // Motion configurations
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Patient Registry</h2>
          <p className="text-sm text-slate-505 mt-1">Manage, search, and register hospital patient records</p>
        </div>

        {hasRole(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']) && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowRegForm(!showRegForm)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 text-xs font-bold text-white rounded-xl transition-all duration-200 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>{showRegForm ? 'View Directory' : 'New Registration'}</span>
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {showRegForm ? (
          /* Patient Registration Form */
          <motion.div 
            key="reg-form"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: 'spring', stiffness: 110, damping: 15 }}
            className="glass-panel border-slate-200/80 rounded-3xl p-6 max-w-3xl mx-auto shadow-sm bg-white"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/60 pb-4 mb-6">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Patient Details Form</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rohan Sharma"
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Age *</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="42"
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Residential Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Residential address details..."
                  className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white h-20 outline-none"
                />
              </div>

              <div className="border-t border-slate-200/60 pt-6">
                <h4 className="text-xs font-bold text-slate-800 mb-4 tracking-wider uppercase">Emergency Contact Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Emergency contact name"
                      className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="Emergency contact phone"
                      className="w-full glass-input px-4 py-3 rounded-xl text-xs text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowRegForm(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-500 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={registerPatientMutation.isPending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-md transition-all duration-200 cursor-pointer"
                >
                  {registerPatientMutation.isPending ? 'Registering...' : 'Save Patient Profile'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Patient Search and Directory List */
          <motion.div 
            key="directory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search directory by name, UHID, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs outline-none focus:border-indigo-500/60"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toast.success('Patient list exported!')}
                className="flex items-center gap-1.5 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 bg-white rounded-xl transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </motion.button>
            </div>

            <div className="glass-panel border-slate-200/80 rounded-3xl overflow-hidden shadow-sm bg-white">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse text-xs">Loading patient database...</div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
                  <Contact className="h-10 w-10 text-slate-300" />
                  <span>No matching patient records found.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/60 font-bold uppercase tracking-wider">
                        <th className="p-4">UHID Code</th>
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Age / Gender</th>
                        <th className="p-4">Blood Group</th>
                        <th className="p-4">Contact Phone</th>
                        <th className="p-4">Admission Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody 
                      variants={tableVariants}
                      initial="hidden"
                      animate="show"
                      className="divide-y divide-slate-100"
                    >
                      {filteredPatients.map((patient) => (
                        <motion.tr 
                          key={patient.id} 
                          variants={rowVariants}
                          className="hover:bg-slate-50/60 text-slate-650 transition-all cursor-pointer"
                        >
                          <td className="p-4 font-mono font-bold text-indigo-600">{patient.uhid}</td>
                          <td className="p-4 font-bold text-slate-800">{patient.name}</td>
                          <td className="p-4 font-semibold text-slate-600">{patient.age} yrs / {patient.gender}</td>
                          <td className="p-4 font-bold text-slate-505">{patient.bloodGroup || 'N/A'}</td>
                          <td className="p-4 font-mono font-semibold text-slate-600">{patient.phone || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                              patient.isAdmitted
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {patient.isAdmitted ? 'Admitted' : 'OPD/Discharged'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedPatientTicket(patient)}
                              className="p-1.5 px-2.5 rounded-lg border border-slate-200 hover:border-indigo-500/40 text-slate-500 hover:text-indigo-650 bg-white transition-all inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                              title="Generate QR Ticket"
                            >
                              <QrCode className="h-3.5 w-3.5 text-indigo-500" />
                              <span>QR Token</span>
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Digital Ticket Modal */}
      <AnimatePresence>
        {selectedPatientTicket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              className="w-full max-w-sm glass-panel border-slate-200/80 rounded-3xl p-6 relative bg-white shadow-xl"
            >
              <button
                onClick={() => setSelectedPatientTicket(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-center space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">iSHRMS Digital QR Receipt</h3>
                <p className="text-[10px] text-slate-505">Scan at any OPD kiosk or Pharmacy counter</p>

                {/* QR Image */}
                <div className="h-44 w-44 bg-white p-2 rounded-2xl mx-auto flex items-center justify-center border-4 border-indigo-500/20 shadow-sm">
                  {selectedPatientTicket.qrCode ? (
                    <img src={selectedPatientTicket.qrCode} alt="UHID QR" className="h-full w-full" />
                  ) : (
                    <QrCode className="h-24 w-24 text-slate-900" />
                  )}
                </div>

                {/* Ticket Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2.5 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">UHID:</span>
                    <span className="font-mono font-bold text-indigo-600">{selectedPatientTicket.uhid}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold text-slate-800">{selectedPatientTicket.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Age/Gender:</span>
                    <span className="font-semibold text-slate-700">{selectedPatientTicket.age} yrs / {selectedPatientTicket.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-bold text-slate-600">{selectedPatientTicket.bloodGroup || 'N/A'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 bg-white cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Ticket</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedPatientTicket(null)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white rounded-xl shadow-md cursor-pointer"
                  >
                    Close Ticket
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Patients;
