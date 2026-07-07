const express = require('express');
const router = express.Router();
const {
  admitPatient,
  dischargePatient,
  getAdmissions
} = require('../controllers/admission.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  admitPatientSchema,
  dischargePatientSchema
} = require('../validators/admission.validator');

router.use(protect);

router.get('/', getAdmissions);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'), validate(admitPatientSchema), admitPatient);
router.post('/discharge/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'), validate(dischargePatientSchema), dischargePatient);

module.exports = router;
