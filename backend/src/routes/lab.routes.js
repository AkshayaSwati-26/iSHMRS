const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  getLabCatalog,
  createLabOrder,
  getLabOrders,
  updateSampleCollection,
  enterLabResults
} = require('../controllers/lab.controller');

router.use(protect);

router.get('/catalog', getLabCatalog);
router.get('/orders', authorize('DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), getLabOrders);
router.post('/orders', authorize('DOCTOR', 'SUPER_ADMIN', 'ADMIN'), createLabOrder);
router.put('/orders/:id/collect', updateSampleCollection);
router.put('/orders/:id/results', enterLabResults);

module.exports = router;
