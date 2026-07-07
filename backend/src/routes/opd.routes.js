const express = require('express');
const router = express.Router();
const {
  generateToken,
  getQueue,
  callNext,
  recallToken,
  skipToken,
  completeToken,
  holdToken,
  transferToken
} = require('../controllers/opd.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { generateTokenSchema } = require('../validators/opd.validator');

router.use(protect);

router.post('/token', authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'), validate(generateTokenSchema), generateToken);
router.get('/queue', getQueue);
router.post('/call-next', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), callNext);
router.post('/recall/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), recallToken);
router.post('/skip/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), skipToken);
router.post('/complete/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), completeToken);
router.post('/hold/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), holdToken);
router.post('/transfer/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'), transferToken);

module.exports = router;
