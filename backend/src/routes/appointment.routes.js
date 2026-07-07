const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

// All routes require JWT authentication
router.use(protect);

router.get('/', getAppointments);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'), createAppointment);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR'), updateAppointment);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'), deleteAppointment);

module.exports = router;
