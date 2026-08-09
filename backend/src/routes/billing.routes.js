const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  createOPDBill,
  createIPDBill,
  recordPayment,
  getBills,
  getBillById,
  getBillingStats
} = require('../controllers/billing.controller');

router.use(protect);

router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), getBillingStats);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST', 'PHARMACIST'), getBills);
router.get('/:id', getBillById);
router.post('/opd', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), createOPDBill);
router.post('/ipd', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), createIPDBill);
router.post('/:id/payment', authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), recordPayment);

module.exports = router;
