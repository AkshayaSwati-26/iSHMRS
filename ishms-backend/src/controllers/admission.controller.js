const prisma = require('../config/prisma');
const { broadcast } = require('../config/socket');
const auditLog = require('../utils/auditLogger');

const admitPatient = async (req, res, next) => {
  try {
    const { patientId, departmentId, doctorId, bedId } = req.body;
    const hospitalId = req.user.hospitalId;

    // Check if bed is available
    const bed = await prisma.bed.findUnique({
      where: { id: bedId }
    });

    if (!bed || bed.status !== 'Available') {
      return res.status(400).json({
        status: 'error',
        message: 'Selected bed is not available'
      });
    }

    const admission = await prisma.$transaction(async (tx) => {
      // 1. Create Admission Record
      const adm = await tx.admission.create({
        data: {
          patientId,
          departmentId,
          doctorId,
          bedId,
          status: 'Admitted'
        },
        include: {
          patient: true,
          bed: true,
          doctor: true
        }
      });

      // 2. Update Bed Status to Occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { status: 'Occupied' }
      });

      // 3. Update Patient Admission Status
      await tx.patient.update({
        where: { id: patientId },
        data: { isAdmitted: true }
      });

      return adm;
    });

    await auditLog(req.user.id, 'PATIENT_ADMITTED', { patientId, admissionId: admission.id, bedLabel: admission.bed.label }, req.ip);

    // Socket updates
    broadcast(hospitalId, 'patient_admitted', admission);
    broadcast(hospitalId, 'bed_assigned', { bedId, status: 'Occupied' });
    broadcast(hospitalId, 'dashboard_updated');

    res.status(201).json({
      status: 'success',
      data: { admission }
    });
  } catch (error) {
    next(error);
  }
};

const dischargePatient = async (req, res, next) => {
  try {
    const { id } = req.params; // admission ID
    const { reason, summary } = req.body;
    const hospitalId = req.user.hospitalId;

    // Get admission record
    const admission = await prisma.admission.findUnique({
      where: { id },
      include: { patient: true, bed: true }
    });

    if (!admission || admission.status !== 'Admitted') {
      return res.status(400).json({
        status: 'error',
        message: 'Active admission record not found'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Discharge Record
      const dsc = await tx.discharge.create({
        data: {
          admissionId: id,
          reason,
          summary
        }
      });

      // 2. Update Admission status
      await tx.admission.update({
        where: { id },
        data: { status: 'Discharged' }
      });

      // 3. Update Bed Status to Cleaning (Nurse has to sanitize it before it is Available again)
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'Cleaning' }
      });

      // 4. Update Patient Admission status to false
      await tx.patient.update({
        where: { id: admission.patientId },
        data: { isAdmitted: false }
      });

      return dsc;
    });

    await auditLog(req.user.id, 'PATIENT_DISCHARGED', { patientId: admission.patientId, admissionId: id, bedLabel: admission.bed.label }, req.ip);

    // Socket updates
    broadcast(hospitalId, 'patient_discharged', { admissionId: id, patientId: admission.patientId });
    broadcast(hospitalId, 'bed_released', { bedId: admission.bedId, status: 'Cleaning' });
    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      message: 'Patient discharged successfully. Bed set to Cleaning.',
      data: { discharge: result }
    });
  } catch (error) {
    next(error);
  }
};

const getAdmissions = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const admissions = await prisma.admission.findMany({
      where: {
        status: 'Admitted',
        department: { hospitalId }
      },
      include: {
        patient: true,
        bed: { include: { room: { include: { ward: true } } } },
        doctor: true
      },
      orderBy: { admittedAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { admissions }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  admitPatient,
  dischargePatient,
  getAdmissions
};
