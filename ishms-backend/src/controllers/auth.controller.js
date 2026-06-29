const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const auditLog = require('../utils/auditLogger');
const logger = require('../utils/logger');

// Helpers for JWT generation
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, roleName, hospitalId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Find the role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: `Role ${roleName} not found`
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: role.id,
        hospitalId
      },
      include: {
        role: true,
        hospital: true
      }
    });

    // Log audit trail
    await auditLog(user.id, 'USER_REGISTERED', { email: user.email, role: role.name }, req.ip);

    // Remove password from response
    delete user.password;

    res.status(201).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, hospital: true }
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Log audit trail
    await auditLog(user.id, 'USER_LOGGED_IN', { email: user.email }, req.ip);

    delete user.password;

    res.status(200).json({
      status: 'success',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await auditLog(req.user.id, 'USER_LOGGED_OUT', { email: req.user.email }, req.ip);
    }
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true, hospital: true }
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid session user'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken
      }
    });
  } catch (error) {
    logger.error('Refresh token verification failed', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired refresh token'
    });
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Fetch full user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Incorrect current password'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log audit trail
    await auditLog(userId, 'PASSWORD_CHANGED', { email: user.email }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password mock implementation
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email address'
      });
    }

    // Generate a mock reset token
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    logger.info(`Password reset requested for ${email}. Token: ${resetToken}`);

    // Return the reset token for demo/testing purposes
    res.status(200).json({
      status: 'success',
      message: 'Password reset link generated. Reset token included in payload for testing.',
      token: resetToken
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    });

    await auditLog(user.id, 'PASSWORD_RESET', { email: user.email }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password failed', error);
    res.status(400).json({
      status: 'error',
      message: 'Invalid or expired password reset token'
    });
  }
};

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: {
          name: 'DOCTOR'
        },
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        hospitalId: true
      }
    });

    res.status(200).json({
      status: 'success',
      data: { doctors }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  changePassword,
  forgotPassword,
  resetPassword,
  getDoctors
};
