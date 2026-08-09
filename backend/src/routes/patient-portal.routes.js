const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  getDashboard,
  getProfile,
  updateProfile,
  getHealthTimeline,
  getPrescriptions,
  getOPDStatus,
  getAppointments,
  bookAppointment,
  cancelAppointment,
  getAdmissionStatus,
  getVitals,
  logVital,
  getSymptomDiary,
  addSymptomEntry,
  getDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
  submitFeedback,
  getInsurance,
  upsertInsurance,
  getFamilyProfiles,
  addFamilyProfile,
  deleteFamilyProfile,
  getTodayMedications,
  markMedicationTaken,
  addMedicationSchedule
} = require('../controllers/patient-portal.controller');

// All routes require PATIENT role
router.use(protect, authorize('PATIENT'));

// Dashboard
router.get('/dashboard', getDashboard);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Health Timeline
router.get('/timeline', getHealthTimeline);

// Prescriptions
router.get('/prescriptions', getPrescriptions);

// OPD Status
router.get('/opd-status', getOPDStatus);

// Appointments
router.get('/appointments', getAppointments);
router.post('/appointments', bookAppointment);
router.put('/appointments/:id/cancel', cancelAppointment);

// Admission Status
router.get('/admission', getAdmissionStatus);

// Vitals
router.get('/vitals', getVitals);
router.post('/vitals', logVital);

// Symptom Diary
router.get('/symptoms', getSymptomDiary);
router.post('/symptoms', addSymptomEntry);

// Document Vault
router.get('/documents', getDocuments);
router.get('/documents/:id', getDocumentById);
router.post('/documents', uploadDocument);
router.delete('/documents/:id', deleteDocument);

// Feedback
router.post('/feedback', submitFeedback);

// Insurance
router.get('/insurance', getInsurance);
router.put('/insurance', upsertInsurance);

// Family Profiles
router.get('/family', getFamilyProfiles);
router.post('/family', addFamilyProfile);
router.delete('/family/:id', deleteFamilyProfile);

// Medication Adherence
router.get('/medications/today', getTodayMedications);
router.post('/medications', addMedicationSchedule);
router.put('/medications/:id/taken', markMedicationTaken);

module.exports = router;
