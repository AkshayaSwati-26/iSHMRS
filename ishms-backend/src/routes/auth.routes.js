const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  refresh,
  changePassword,
  forgotPassword,
  resetPassword,
  getDoctors
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.validator');

// Public auth routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected auth routes
router.get('/doctors', protect, getDoctors);
router.post('/logout', protect, logout);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);

module.exports = router;
