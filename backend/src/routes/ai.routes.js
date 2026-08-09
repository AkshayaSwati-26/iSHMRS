const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  symptomChecker,
  diagnosisAssist,
  drugInteractionCheck,
  generateDischargeSummary,
  staffChatbot
} = require('../controllers/ai.controller');

// Protected AI Endpoints
router.use(protect);

// Patient & Staff accessible
router.post('/symptom-checker', symptomChecker);
router.post('/chatbot', staffChatbot);

// Clinical staff accessible
router.post('/diagnosis-assist', authorize('DOCTOR', 'SUPER_ADMIN', 'ADMIN'), diagnosisAssist);
router.post('/drug-interaction', authorize('DOCTOR', 'PHARMACIST', 'SUPER_ADMIN', 'ADMIN'), drugInteractionCheck);
router.post('/discharge-summary', authorize('DOCTOR', 'NURSE', 'SUPER_ADMIN', 'ADMIN'), generateDischargeSummary);

module.exports = router;
