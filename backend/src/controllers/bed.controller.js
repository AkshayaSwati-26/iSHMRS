const prisma = require('../config/prisma');
const { broadcast } = require('../config/socket');
const auditLog = require('../utils/auditLogger');

const getBeds = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const beds = await prisma.bed.findMany({
      where: {
        deletedAt: null,
        room: { ward: { department: { hospitalId } } }
      },
      include: {
        room: { include: { ward: { include: { department: true } } } },
        admissions: {
          where: { status: 'Admitted' },
          include: { patient: true }
        }
      },
      orderBy: { label: 'asc' }
    });

    res.status(200).json({
      status: 'success',
      data: { beds }
    });
  } catch (error) {
    next(error);
  }
};

const createBed = async (req, res, next) => {
  try {
    const { label, roomId, type, status } = req.body;
    const hospitalId = req.user.hospitalId;

    // Verify room exists in this hospital
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        ward: { department: { hospitalId } }
      }
    });

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found in this hospital'
      });
    }

    const bed = await prisma.bed.create({
      data: {
        label,
        roomId,
        type,
        status: status || 'Available'
      },
      include: {
        room: { include: { ward: { include: { department: true } } } }
      }
    });

    await auditLog(req.user.id, 'BED_CREATED', { bedId: bed.id, label: bed.label }, req.ip);

    broadcast(hospitalId, 'dashboard_updated');

    res.status(201).json({
      status: 'success',
      data: { bed }
    });
  } catch (error) {
    next(error);
  }
};

const updateBedStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hospitalId = req.user.hospitalId;

    // Check if bed is currently occupied and status is being changed to something else
    const bed = await prisma.bed.findUnique({
      where: { id },
      include: { admissions: { where: { status: 'Admitted' } } }
    });

    if (!bed) {
      return res.status(404).json({
        status: 'error',
        message: 'Bed not found'
      });
    }

    if (bed.status === 'Occupied' && status !== 'Occupied' && bed.admissions.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot change status of an occupied bed. Discharge the patient first.'
      });
    }

    const updatedBed = await prisma.bed.update({
      where: { id },
      data: { status },
      include: { room: { include: { ward: { include: { department: true } } } } }
    });

    await auditLog(req.user.id, 'BED_STATUS_CHANGED', { bedId: id, label: updatedBed.label, oldStatus: bed.status, newStatus: status }, req.ip);

    // Broadcast Socket.io event
    broadcast(hospitalId, 'bed_status_changed', { bedId: id, status });
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { bed: updatedBed }
    });
  } catch (error) {
    next(error);
  }
};

const transferPatient = async (req, res, next) => {
  try {
    const { admissionId, targetBedId } = req.body;
    const hospitalId = req.user.hospitalId;

    // Fetch active admission
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { patient: true, bed: true }
    });

    if (!admission || admission.status !== 'Admitted') {
      return res.status(400).json({
        status: 'error',
        message: 'Active admission record not found'
      });
    }

    // Check if target bed is available
    const targetBed = await prisma.bed.findUnique({
      where: { id: targetBedId }
    });

    if (!targetBed || targetBed.status !== 'Available') {
      return res.status(400).json({
        status: 'error',
        message: 'Target bed is not available'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Release old bed (status -> Cleaning)
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'Cleaning' }
      });

      // 2. Occupy new bed (status -> Occupied)
      await tx.bed.update({
        where: { id: targetBedId },
        data: { status: 'Occupied' }
      });

      // 3. Update Admission record with new bed ID
      const updatedAdm = await tx.admission.update({
        where: { id: admissionId },
        data: { bedId: targetBedId },
        include: { patient: true, bed: true }
      });

      return updatedAdm;
    });

    await auditLog(req.user.id, 'BED_TRANSFER', {
      patientId: admission.patientId,
      admissionId,
      fromBed: admission.bed.label,
      toBed: result.bed.label
    }, req.ip);

    // Socket broadcasts
    broadcast(hospitalId, 'bed_status_changed', { bedId: admission.bedId, status: 'Cleaning' });
    broadcast(hospitalId, 'bed_status_changed', { bedId: targetBedId, status: 'Occupied' });
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      message: 'Patient transferred successfully',
      data: { admission: result }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBeds,
  createBed,
  updateBedStatus,
  transferPatient
};
