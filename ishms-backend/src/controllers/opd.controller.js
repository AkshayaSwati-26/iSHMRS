const prisma = require('../config/prisma');
const { broadcast } = require('../config/socket');
const auditLog = require('../utils/auditLogger');

const priorityWeight = {
  Emergency: 4,
  SeniorCitizen: 3,
  Pregnancy: 2,
  Normal: 1
};

const generateToken = async (req, res, next) => {
  try {
    const { patientId, departmentId, doctorId, priority } = req.body;
    const hospitalId = req.user.hospitalId;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    // Generate token number (daily increment per department)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tokenCount = await prisma.oPDToken.count({
      where: {
        departmentId,
        createdAt: { gte: today }
      }
    });

    const tokenNumber = tokenCount + 1;

    const opdToken = await prisma.oPDToken.create({
      data: {
        tokenNumber,
        patientId,
        departmentId,
        doctorId,
        priority,
        status: 'Waiting'
      },
      include: {
        patient: true,
        department: true,
        doctor: true
      }
    });

    await auditLog(req.user?.id, 'TOKEN_GENERATED', { tokenId: opdToken.id, tokenNumber, patientName: patient.name }, req.ip);

    // Broadcast queue update
    broadcast(hospitalId, 'token_generated', opdToken);
    broadcast(hospitalId, 'dashboard_updated');

    res.status(201).json({
      status: 'success',
      data: { opdToken }
    });
  } catch (error) {
    next(error);
  }
};

const getQueue = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const hospitalId = req.user.hospitalId;

    const whereClause = { deletedAt: null };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else if (hospitalId) {
      // Filter by department belonging to this hospital
      whereClause.department = { hospitalId };
    }

    const tokens = await prisma.oPDToken.findMany({
      where: whereClause,
      include: {
        patient: true,
        department: true,
        doctor: true
      }
    });

    // Intelligent Sorting: InConsultation first, then Waiting sorted by priority and token number
    tokens.sort((a, b) => {
      const statusWeight = { InConsultation: 3, Waiting: 2, Completed: 1, Cancelled: 0, NoShow: 0 };
      if (a.status !== b.status) {
        return (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
      }
      if (a.status === 'Waiting') {
        if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return a.tokenNumber - b.tokenNumber;
      }
      // Completed, NoShow, Cancelled sorted by updated time (newest first)
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.status(200).json({
      status: 'success',
      data: { queue: tokens }
    });
  } catch (error) {
    next(error);
  }
};

const callNext = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    const doctorId = req.user.id;
    const hospitalId = req.user.hospitalId;

    if (!departmentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Department ID is required'
      });
    }

    // Get all waiting tokens
    const waitingTokens = await prisma.oPDToken.findMany({
      where: { departmentId, status: 'Waiting' },
      include: { patient: true }
    });

    if (waitingTokens.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No patients waiting in queue',
        data: null
      });
    }

    // Sort in JS: Priority descending, then tokenNumber ascending
    waitingTokens.sort((a, b) => {
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return a.tokenNumber - b.tokenNumber;
    });

    const nextToken = waitingTokens[0];

    // Update token status to InConsultation
    const updatedToken = await prisma.oPDToken.update({
      where: { id: nextToken.id },
      data: {
        status: 'InConsultation',
        doctorId,
        calledAt: new Date()
      },
      include: {
        patient: true,
        department: true,
        doctor: true
      }
    });

    await auditLog(doctorId, 'TOKEN_CALLED', { tokenId: updatedToken.id, tokenNumber: updatedToken.tokenNumber }, req.ip);

    // Broadcast Socket.io event
    broadcast(hospitalId, 'token_called', updatedToken);
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { opdToken: updatedToken }
    });
  } catch (error) {
    next(error);
  }
};

const recallToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const token = await prisma.oPDToken.findUnique({
      where: { id },
      include: { patient: true, department: true, doctor: true }
    });

    if (!token || token.status !== 'InConsultation') {
      return res.status(400).json({
        status: 'error',
        message: 'Token is not currently in consultation'
      });
    }

    broadcast(hospitalId, 'token_called', token); // re-emit token call announcement

    res.status(200).json({
      status: 'success',
      message: 'Token recall broadcasted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const skipToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const updatedToken = await prisma.oPDToken.update({
      where: { id },
      data: { status: 'NoShow' },
      include: { patient: true, department: true, doctor: true }
    });

    await auditLog(req.user.id, 'TOKEN_SKIPPED', { tokenId: id, tokenNumber: updatedToken.tokenNumber }, req.ip);

    broadcast(hospitalId, 'token_completed', updatedToken); // socket update
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { opdToken: updatedToken }
    });
  } catch (error) {
    next(error);
  }
};

const completeToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const updatedToken = await prisma.oPDToken.update({
      where: { id },
      data: {
        status: 'Completed',
        completedAt: new Date()
      },
      include: { patient: true, department: true, doctor: true }
    });

    await auditLog(req.user.id, 'TOKEN_COMPLETED', { tokenId: id, tokenNumber: updatedToken.tokenNumber }, req.ip);

    broadcast(hospitalId, 'token_completed', updatedToken);
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { opdToken: updatedToken }
    });
  } catch (error) {
    next(error);
  }
};

const holdToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const updatedToken = await prisma.oPDToken.update({
      where: { id },
      data: { status: 'Waiting' },
      include: { patient: true, department: true, doctor: true }
    });

    broadcast(hospitalId, 'token_completed', updatedToken); // put back in waiting list
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { opdToken: updatedToken }
    });
  } catch (error) {
    next(error);
  }
};

const transferToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId, doctorId } = req.body;
    const hospitalId = req.user.hospitalId;

    const updatedToken = await prisma.oPDToken.update({
      where: { id },
      data: {
        departmentId,
        doctorId,
        status: 'Waiting' // reset status to waiting in the new department
      },
      include: { patient: true, department: true, doctor: true }
    });

    await auditLog(req.user.id, 'TOKEN_TRANSFERRED', { tokenId: id, targetDepartmentId: departmentId }, req.ip);

    broadcast(hospitalId, 'token_completed', { id, status: 'Transferred' }); // remove from old
    broadcast(hospitalId, 'token_generated', updatedToken); // add to new
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { opdToken: updatedToken }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateToken,
  getQueue,
  callNext,
  recallToken,
  skipToken,
  completeToken,
  holdToken,
  transferToken
};
