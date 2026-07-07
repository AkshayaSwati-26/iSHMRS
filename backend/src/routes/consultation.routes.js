const express = require('express');
const router = express.Router();
const {
  addConsultation,
  getConsultationsByPatient
} = require('../controllers/consultation.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { addConsultationSchema } = require('../validators/consultation.validator');

router.use(protect);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), validate(addConsultationSchema), addConsultation);
router.get('/patient/:patientId', getConsultationsByPatient);

module.exports = router;
