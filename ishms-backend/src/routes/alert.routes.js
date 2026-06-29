const express = require('express');
const router = express.Router();
const { getAlerts, acknowledgeAlert } = require('../controllers/alert.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');

router.use(protect);

router.get('/', getAlerts);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), acknowledgeAlert);

module.exports = router;
