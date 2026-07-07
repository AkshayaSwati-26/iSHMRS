const express = require('express');
const router = express.Router();
const {
  getBeds,
  createBed,
  updateBedStatus,
  transferPatient
} = require('../controllers/bed.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createBedSchema,
  updateBedStatusSchema
} = require('../validators/bed.validator');

router.use(protect);

router.get('/', getBeds);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), validate(createBedSchema), createBed);
router.put('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'NURSE'), validate(updateBedStatusSchema), updateBedStatus);
router.post('/transfer', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'NURSE'), transferPatient);

module.exports = router;
