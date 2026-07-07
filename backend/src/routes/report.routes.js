const express = require('express');
const router = Router = express.Router();
const { getReports, generateReport } = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', getReports);
router.post('/', generateReport);

module.exports = router;
