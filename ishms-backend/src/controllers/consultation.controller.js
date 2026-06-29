const prisma = require('../config/prisma');
const auditLog = require('../utils/auditLogger');

const addConsultation = async (req, res, next) => {
  try {
    const {
      tokenId,
      patientId,
      symptoms,
      diagnosis,
      vitals,
      prescriptions,
      labRecommendations,
      admissionRecommended,
      followUpDate,
      notes
    } = req.body;
    const doctorId = req.user.id;
    const hospitalId = req.user.hospitalId;

    // Use transaction to write consultation, history, and complete token
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Consultation
      const consultation = await tx.consultation.create({
        data: {
          tokenId,
          patientId,
          doctorId,
          symptoms,
          diagnosis,
          vitals,
          prescriptions,
          labRecommendations,
          admissionRecommended,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          notes
        }
      });

      // 2. Create Patient History record
      await tx.patientHistory.create({
        data: {
          patientId,
          symptoms,
          diagnosis,
          vitals,
          notes: notes || 'Consultation record'
        }
      });

      // 3. Mark OPD Token as Completed
      await tx.oPDToken.update({
        where: { id: tokenId },
        data: {
          status: 'Completed',
          completedAt: new Date()
        }
      });

      return consultation;
    });

    await auditLog(doctorId, 'CONSULTATION_ADDED', { patientId, consultationId: result.id, admissionRecommended }, req.ip);

    // Broadcast socket updates
    const { broadcast } = require('../config/socket');
    broadcast(hospitalId, 'token_completed', { id: tokenId, status: 'Completed' });
    broadcast(hospitalId, 'dashboard_updated');

    res.status(201).json({
      status: 'success',
      data: { consultation: result }
    });
  } catch (error) {
    next(error);
  }
};

const getConsultationsByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const consultations = await prisma.consultation.findMany({
      where: { patientId, deletedAt: null },
      include: { doctor: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { consultations }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addConsultation,
  getConsultationsByPatient
};
