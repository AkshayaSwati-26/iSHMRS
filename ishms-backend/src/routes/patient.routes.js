const express = require('express');
const router = express.Router();
const {
  registerPatient,
  getPatients,
  getPatientById
} = require('../controllers/patient.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerPatientSchema } = require('../validators/patient.validator');

router.use(protect);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'), validate(registerPatientSchema), registerPatient);

module.exports = router;
