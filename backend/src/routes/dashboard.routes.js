const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getDashboardStats);

module.exports = router;
