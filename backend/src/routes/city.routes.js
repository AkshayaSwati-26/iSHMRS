const express = require('express');
const router = express.Router();
const { syncHospitalData, getCityOverview } = require('../controllers/city.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

// Public sync API (used by individual hospital cron sync services)
router.post('/sync', syncHospitalData);

// Protected overview API (only for Super Admins)
router.get('/overview', protect, authorize('SUPER_ADMIN'), getCityOverview);

module.exports = router;
