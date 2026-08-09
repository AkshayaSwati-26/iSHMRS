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

// ==========================================
// PATIENT AUTH — Hybrid Registration
// ==========================================

// Generate unique UHID: UHID-YYYYMMDD-XXXXX
const generateUHID = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `UHID-${date}-${rand}`;
};

/**
 * PATIENT REGISTER — Hybrid Flow
 * flow=claim  → UHID + dateOfBirth + phone → set password (links existing Patient to new User)
 * flow=new    → full personal details → creates Patient + User simultaneously
 */
const patientRegister = async (req, res, next) => {
  try {
    const { flow } = req.body;

    // Find PATIENT role
    const patientRole = await prisma.role.findUnique({ where: { name: 'PATIENT' } });
    if (!patientRole) {
      return res.status(500).json({ status: 'error', message: 'Patient role not configured. Contact admin.' });
    }

    // ──────────────────────────────────────────────
    // FLOW A: Claim existing patient record via UHID
    // ──────────────────────────────────────────────
    if (flow === 'claim') {
      const { uhid, dateOfBirth, phone, email, password } = req.body;

      if (!uhid || !dateOfBirth || !phone || !email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'UHID, date of birth, registered phone, email, and password are required'
        });
      }

      // Find patient record
      const patient = await prisma.patient.findUnique({ where: { uhid } });
      if (!patient || patient.deletedAt) {
        return res.status(404).json({
          status: 'error',
          message: 'No patient record found with this UHID. Please contact the hospital reception.'
        });
      }

      // 3-Factor Verification: UHID + DOB + Phone
      const dobMatch = patient.dateOfBirth
        ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) === new Date(dateOfBirth).toISOString().slice(0, 10)
        : true; // If DOB not on record, skip DOB check (phone is enough)

      const phoneMatch = patient.phone
        ? patient.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10)
        : false;

      if (!phoneMatch || !dobMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Verification failed. UHID, date of birth, and phone number do not match our records.'
        });
      }

      // Check if already claimed
      if (patient.userId) {
        return res.status(409).json({
          status: 'error',
          message: 'This patient record already has a portal account. Please login instead.'
        });
      }

      // Check email uniqueness
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(409).json({ status: 'error', message: 'This email is already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create User + link to Patient in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: patient.name.split(' ')[0] || patient.name,
            lastName: patient.name.split(' ').slice(1).join(' ') || '',
            roleId: patientRole.id,
            hospitalId: null
          },
          include: { role: true }
        });

        await tx.patient.update({
          where: { id: patient.id },
          data: {
            userId: user.id,
            email,
            ...(patient.dateOfBirth === null && dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {})
          }
        });

        return user;
      });

      await auditLog(result.id, 'PATIENT_PORTAL_CLAIMED', { uhid, email }, req.ip);
      delete result.password;

      const accessToken = generateAccessToken(result.id);
      const refreshToken = generateRefreshToken(result.id);

      return res.status(201).json({
        status: 'success',
        message: 'Patient portal account created successfully!',
        data: { user: result, accessToken, refreshToken }
      });
    }

    // ──────────────────────────────────────────────
    // FLOW B: New Patient Self-Registration
    // ──────────────────────────────────────────────
    if (flow === 'new') {
      const { name, email, password, phone, gender, dateOfBirth, bloodGroup, address,
              emergencyContactName, emergencyContactPhone } = req.body;

      if (!name || !email || !password || !phone || !gender) {
        return res.status(400).json({
          status: 'error',
          message: 'Name, email, password, phone, and gender are required'
        });
      }

      // Check uniqueness
      const [emailExists, phoneExists] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.patient.findFirst({ where: { phone } })
      ]);

      if (emailExists) {
        return res.status(409).json({ status: 'error', message: 'Email already registered' });
      }
      if (phoneExists) {
        return res.status(409).json({
          status: 'error',
          message: 'A patient with this phone number already exists. Try claiming your account with your UHID.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const uhid = generateUHID();

      // Ensure UHID uniqueness (retry if collision)
      const uhidExists = await prisma.patient.findUnique({ where: { uhid } });
      const finalUhid = uhidExists ? generateUHID() : uhid;

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            roleId: patientRole.id,
            hospitalId: null
          },
          include: { role: true }
        });

        const patient = await tx.patient.create({
          data: {
            uhid: finalUhid,
            name,
            age: dateOfBirth ? Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 3600 * 1000)) : 0,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            bloodGroup,
            phone,
            email,
            address,
            emergencyContactName,
            emergencyContactPhone,
            userId: user.id
          }
        });

        return { user, patient };
      });

      await auditLog(result.user.id, 'PATIENT_SELF_REGISTERED', { uhid: finalUhid, email }, req.ip);
      delete result.user.password;

      const accessToken = generateAccessToken(result.user.id);
      const refreshToken = generateRefreshToken(result.user.id);

      return res.status(201).json({
        status: 'success',
        message: `Welcome to iSHRMS! Your UHID is: ${finalUhid}`,
        data: { user: result.user, patient: result.patient, accessToken, refreshToken }
      });
    }

    return res.status(400).json({ status: 'error', message: 'Invalid flow. Use "claim" or "new"' });
  } catch (error) {
    next(error);
  }
};

const patientLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, patientProfile: true }
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    if (user.role.name !== 'PATIENT') {
      return res.status(403).json({
        status: 'error',
        message: 'This login is for patients only. Staff please use the main portal.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await auditLog(user.id, 'PATIENT_LOGGED_IN', { email: user.email }, req.ip);
    delete user.password;

    res.status(200).json({
      status: 'success',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

// Check if UHID is claimable (pre-validation before registration form)
const checkUHID = async (req, res, next) => {
  try {
    const { uhid } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { uhid },
      select: { id: true, name: true, userId: true, deletedAt: true }
    });

    if (!patient || patient.deletedAt) {
      return res.status(404).json({ status: 'error', message: 'UHID not found in our records' });
    }
    if (patient.userId) {
      return res.status(409).json({ status: 'error', message: 'This UHID already has a portal account' });
    }

    // Return partial info only (privacy)
    const maskedName = patient.name.charAt(0) + '*'.repeat(Math.max(0, patient.name.length - 2)) + patient.name.charAt(patient.name.length - 1);

    res.status(200).json({
      status: 'success',
      data: { available: true, maskedName }
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
  getDoctors,
  patientRegister,
  patientLogin,
  checkUHID
};
