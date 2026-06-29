const express = require('express');
const router = express.Router();
const {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getTransactions
} = require('../controllers/medicine.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createMedicineSchema,
  updateMedicineSchema,
  updateStockSchema
} = require('../validators/medicine.validator');

router.use(protect);

router.get('/', getMedicines);
router.get('/transactions', getTransactions);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), validate(createMedicineSchema), addMedicine);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), validate(updateMedicineSchema), updateMedicine);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), deleteMedicine);
router.post('/:id/stock', authorize('SUPER_ADMIN', 'ADMIN', 'PHARMACIST'), validate(updateStockSchema), updateStock);

module.exports = router;
