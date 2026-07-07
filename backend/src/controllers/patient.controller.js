const prisma = require('../config/prisma');
const QRCode = require('qrcode');
const auditLog = require('../utils/auditLogger');

const registerPatient = async (req, res, next) => {
  try {
    const { name, age, gender, bloodGroup, phone, address, emergencyContactName, emergencyContactPhone } = req.body;

    // Generate unique UHID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const uhid = `UHID-${randomNum}`;

    // Generate QR Code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(uhid);

    const patient = await prisma.patient.create({
      data: {
        uhid,
        name,
        age,
        gender,
        bloodGroup,
        phone,
        address,
        emergencyContactName,
        emergencyContactPhone
      }
    });

    // Log audit
    await auditLog(req.user?.id, 'PATIENT_REGISTERED', { patientId: patient.id, uhid }, req.ip);

    res.status(201).json({
      status: 'success',
      data: {
        patient: {
          ...patient,
          qrCode: qrCodeDataUrl
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPatients = async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { patients }
    });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        histories: { orderBy: { createdAt: 'desc' } },
        admissions: { include: { bed: { include: { room: { include: { ward: true } } } }, doctor: true } }
      }
    });

    if (!patient || patient.deletedAt) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    const qrCodeDataUrl = await QRCode.toDataURL(patient.uhid);

    res.status(200).json({
      status: 'success',
      data: {
        patient: {
          ...patient,
          qrCode: qrCodeDataUrl
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById
};
