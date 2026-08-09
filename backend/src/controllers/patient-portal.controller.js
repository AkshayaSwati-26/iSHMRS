const prisma = require('../config/prisma');
const auditLog = require('../utils/auditLogger');

// ==========================================
// DASHBOARD
// ==========================================
const getDashboard = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        admissions: {
          where: { status: 'Admitted' },
          include: {
            bed: { include: { room: { include: { ward: true } } } },
            department: true,
            doctor: { select: { firstName: true, lastName: true } }
          },
          orderBy: { admittedAt: 'desc' },
          take: 1
        },
        appointments: {
          where: {
            status: 'Scheduled',
            appointmentDate: { gte: new Date() }
          },
          include: {
            doctor: { select: { firstName: true, lastName: true } },
            department: true
          },
          orderBy: { appointmentDate: 'asc' },
          take: 1
        },
        opdTokens: {
          where: { status: { in: ['Waiting', 'InConsultation'] } },
          include: {
            department: true,
            doctor: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        vitalLogs: {
          orderBy: { loggedAt: 'desc' },
          take: 20
        },
        medicationAdherence: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found' });
    }

    // Calculate health score from recent vitals
    const healthScore = calculateHealthScore(patient.vitalLogs);

    res.status(200).json({
      status: 'success',
      data: {
        patient: {
          id: patient.id,
          uhid: patient.uhid,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          phone: patient.phone,
          isAdmitted: patient.isAdmitted
        },
        activeAdmission: patient.admissions[0] || null,
        nextAppointment: patient.appointments[0] || null,
        activeOPDToken: patient.opdTokens[0] || null,
        recentVitals: patient.vitalLogs,
        todayMedications: patient.medicationAdherence,
        healthScore
      }
    });
  } catch (error) {
    next(error);
  }
};

// Health score calculation (0-100)
const calculateHealthScore = (vitalLogs) => {
  if (!vitalLogs || vitalLogs.length === 0) return null;

  let score = 100;
  const latest = {};

  // Get most recent of each type
  vitalLogs.forEach(log => {
    if (!latest[log.type]) latest[log.type] = log;
  });

  // Deduct for out-of-range vitals
  if (latest.BloodPressure) {
    const systolic = latest.BloodPressure.value;
    const diastolic = latest.BloodPressure.value2;
    if (systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60) score -= 20;
  }
  if (latest.BloodSugar) {
    const sugar = latest.BloodSugar.value;
    if (sugar > 140 || sugar < 70) score -= 20;
  }
  if (latest.SpO2) {
    if (latest.SpO2.value < 95) score -= 25;
  }
  if (latest.HeartRate) {
    const hr = latest.HeartRate.value;
    if (hr > 100 || hr < 60) score -= 15;
  }

  return Math.max(0, score);
};

// ==========================================
// PROFILE
// ==========================================
const getProfile = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        insuranceDetails: true,
        familyProfiles: true
      }
    });

    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    res.status(200).json({ status: 'success', data: { patient } });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const {
      address, phone, emergencyContactName, emergencyContactPhone,
      bloodGroup, dateOfBirth
    } = req.body;

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...(address && { address }),
        ...(phone && { phone }),
        ...(emergencyContactName && { emergencyContactName }),
        ...(emergencyContactPhone && { emergencyContactPhone }),
        ...(bloodGroup && { bloodGroup }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) })
      }
    });

    await auditLog(req.user.id, 'PATIENT_PROFILE_UPDATED', { patientId: patient.id }, req.ip);
    res.status(200).json({ status: 'success', data: { patient: updated } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// HEALTH TIMELINE
// ==========================================
const getHealthTimeline = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { year, departmentId } = req.query;

    const dateFilter = year
      ? { gte: new Date(`${year}-01-01`), lt: new Date(`${parseInt(year) + 1}-01-01`) }
      : undefined;

    const [consultations, admissions] = await Promise.all([
      prisma.consultation.findMany({
        where: {
          patientId: patient.id,
          deletedAt: null,
          ...(dateFilter && { createdAt: dateFilter })
        },
        include: {
          doctor: { select: { firstName: true, lastName: true } },
          token: { include: { department: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.admission.findMany({
        where: {
          patientId: patient.id,
          deletedAt: null,
          ...(dateFilter && { admittedAt: dateFilter })
        },
        include: {
          doctor: { select: { firstName: true, lastName: true } },
          department: true,
          bed: { include: { room: { include: { ward: true } } } },
          discharges: { orderBy: { dischargedAt: 'desc' }, take: 1 }
        },
        orderBy: { admittedAt: 'desc' }
      })
    ]);

    // Merge and sort timeline events
    const timeline = [
      ...consultations.map(c => ({ type: 'consultation', date: c.createdAt, data: c })),
      ...admissions.map(a => ({ type: 'admission', date: a.admittedAt, data: a }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ status: 'success', data: { timeline } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRESCRIPTIONS
// ==========================================
const getPrescriptions = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const consultations = await prisma.consultation.findMany({
      where: { patientId: patient.id, deletedAt: null, prescriptions: { not: null } },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        token: { include: { department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const prescriptions = consultations.map(c => ({
      consultationId: c.id,
      date: c.createdAt,
      doctor: c.doctor,
      department: c.token?.department,
      diagnosis: c.diagnosis,
      medicines: c.prescriptions,
      followUpDate: c.followUpDate
    }));

    res.status(200).json({ status: 'success', data: { prescriptions } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// OPD STATUS
// ==========================================
const getOPDStatus = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const activeToken = await prisma.oPDToken.findFirst({
      where: {
        patientId: patient.id,
        status: { in: ['Waiting', 'InConsultation'] }
      },
      include: {
        department: true,
        doctor: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let queuePosition = null;
    let totalAhead = null;

    if (activeToken && activeToken.status === 'Waiting') {
      // Count how many are ahead in queue
      totalAhead = await prisma.oPDToken.count({
        where: {
          departmentId: activeToken.departmentId,
          status: 'Waiting',
          tokenNumber: { lt: activeToken.tokenNumber },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });
      queuePosition = totalAhead + 1;
    }

    res.status(200).json({
      status: 'success',
      data: { activeToken, queuePosition, totalAhead }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// APPOINTMENTS
// ==========================================
const getAppointments = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { status } = req.query;

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        deletedAt: null,
        ...(status && { status })
      },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        department: true
      },
      orderBy: { appointmentDate: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { appointments } });
  } catch (error) {
    next(error);
  }
};

const bookAppointment = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { doctorId, departmentId, appointmentDate, timeSlot, notes, preConsultationForm } = req.body;

    // Check for double booking
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: new Date(appointmentDate),
        timeSlot,
        status: 'Scheduled',
        deletedAt: null
      }
    });

    if (conflict) {
      return res.status(409).json({
        status: 'error',
        message: 'This time slot is already booked. Please choose another.'
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        departmentId,
        appointmentDate: new Date(appointmentDate),
        timeSlot,
        notes,
        preConsultationForm: preConsultationForm || null
      },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        department: true
      }
    });

    await auditLog(req.user.id, 'PATIENT_APPOINTMENT_BOOKED', { appointmentId: appointment.id }, req.ip);

    res.status(201).json({ status: 'success', data: { appointment } });
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: patient.id, deletedAt: null }
    });

    if (!appointment) return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    if (appointment.status !== 'Scheduled') {
      return res.status(400).json({ status: 'error', message: 'Only scheduled appointments can be cancelled' });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'Cancelled', notes: reason ? `Cancelled: ${reason}` : appointment.notes }
    });

    res.status(200).json({ status: 'success', message: 'Appointment cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMISSION STATUS
// ==========================================
const getAdmissionStatus = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const currentAdmission = await prisma.admission.findFirst({
      where: { patientId: patient.id, status: 'Admitted', deletedAt: null },
      include: {
        bed: { include: { room: { include: { ward: { include: { department: true } } } } } },
        department: true,
        doctor: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    const recentDischarge = await prisma.admission.findFirst({
      where: { patientId: patient.id, status: 'Discharged', deletedAt: null },
      include: {
        discharges: { orderBy: { dischargedAt: 'desc' }, take: 1 },
        department: true,
        doctor: { select: { firstName: true, lastName: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { currentAdmission, recentDischarge }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// VITAL LOGS
// ==========================================
const getVitals = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { type, days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const vitals = await prisma.patientVitalLog.findMany({
      where: {
        patientId: patient.id,
        loggedAt: { gte: since },
        ...(type && { type })
      },
      orderBy: { loggedAt: 'asc' }
    });

    res.status(200).json({ status: 'success', data: { vitals } });
  } catch (error) {
    next(error);
  }
};

const logVital = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { type, value, value2, unit, notes, loggedAt } = req.body;

    const vital = await prisma.patientVitalLog.create({
      data: {
        patientId: patient.id,
        type,
        value: parseFloat(value),
        value2: value2 ? parseFloat(value2) : null,
        unit,
        notes,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date()
      }
    });

    res.status(201).json({ status: 'success', data: { vital } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SYMPTOM DIARY
// ==========================================
const getSymptomDiary = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { days = 90 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const entries = await prisma.patientSymptomEntry.findMany({
      where: { patientId: patient.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { entries } });
  } catch (error) {
    next(error);
  }
};

const addSymptomEntry = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { symptoms, severity, notes, loggedAt } = req.body;

    const entry = await prisma.patientSymptomEntry.create({
      data: {
        patientId: patient.id,
        symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
        severity: severity || 'Mild',
        notes,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date()
      }
    });

    res.status(201).json({ status: 'success', data: { entry } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DOCUMENT VAULT
// ==========================================
const getDocuments = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { type } = req.query;

    const documents = await prisma.patientDocument.findMany({
      where: {
        patientId: patient.id,
        deletedAt: null,
        ...(type && { type })
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true, name: true, type: true, fileSize: true,
        mimeType: true, notes: true, uploadedAt: true, createdAt: true
        // Exclude fileUrl from list to save bandwidth — fetch individually
      }
    });

    res.status(200).json({ status: 'success', data: { documents } });
  } catch (error) {
    next(error);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const document = await prisma.patientDocument.findFirst({
      where: { id: req.params.id, patientId: patient.id, deletedAt: null }
    });

    if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });

    res.status(200).json({ status: 'success', data: { document } });
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { name, type, fileUrl, fileSize, mimeType, notes } = req.body;

    // Limit document size (5MB base64 ~ 6.7MB string)
    if (fileUrl && fileUrl.length > 7 * 1024 * 1024) {
      return res.status(413).json({ status: 'error', message: 'File too large. Maximum size is 5MB.' });
    }

    const document = await prisma.patientDocument.create({
      data: {
        patientId: patient.id,
        name,
        type: type || 'Other',
        fileUrl,
        fileSize: fileSize ? parseInt(fileSize) : null,
        mimeType,
        notes
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        document: {
          id: document.id, name: document.name, type: document.type,
          fileSize: document.fileSize, mimeType: document.mimeType,
          notes: document.notes, uploadedAt: document.uploadedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const document = await prisma.patientDocument.findFirst({
      where: { id: req.params.id, patientId: patient.id, deletedAt: null }
    });

    if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });

    await prisma.patientDocument.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });

    res.status(200).json({ status: 'success', message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FEEDBACK
// ==========================================
const submitFeedback = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { consultationId, doctorId, hospitalId, rating, comment, isAnonymous, npsScore } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
    }

    const feedback = await prisma.patientFeedback.create({
      data: {
        patientId: patient.id,
        consultationId,
        doctorId,
        hospitalId,
        rating: parseInt(rating),
        comment,
        isAnonymous: isAnonymous || false,
        npsScore: npsScore ? parseInt(npsScore) : null
      }
    });

    res.status(201).json({ status: 'success', data: { feedback } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INSURANCE
// ==========================================
const getInsurance = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { insuranceDetails: true }
    });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    res.status(200).json({ status: 'success', data: { insurance: patient.insuranceDetails } });
  } catch (error) {
    next(error);
  }
};

const upsertInsurance = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { provider, policyNumber, groupNumber, holderName, validFrom, validTo, coverageAmount, notes } = req.body;

    const insurance = await prisma.insuranceDetails.upsert({
      where: { patientId: patient.id },
      update: { provider, policyNumber, groupNumber, holderName, validFrom: new Date(validFrom), validTo: new Date(validTo), coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null, notes },
      create: { patientId: patient.id, provider, policyNumber, groupNumber, holderName, validFrom: new Date(validFrom), validTo: new Date(validTo), coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null, notes }
    });

    res.status(200).json({ status: 'success', data: { insurance } });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FAMILY PROFILES
// ==========================================
const getFamilyProfiles = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: { familyProfiles: { orderBy: { createdAt: 'asc' } } }
    });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    res.status(200).json({ status: 'success', data: { familyProfiles: patient.familyProfiles } });
  } catch (error) {
    next(error);
  }
};

const addFamilyProfile = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { name, relation, age, gender, bloodGroup, phone, notes } = req.body;

    const profile = await prisma.familyProfile.create({
      data: { patientId: patient.id, name, relation, age: age ? parseInt(age) : null, gender, bloodGroup, phone, notes }
    });

    res.status(201).json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
};

const deleteFamilyProfile = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    await prisma.familyProfile.deleteMany({
      where: { id: req.params.id, patientId: patient.id }
    });

    res.status(200).json({ status: 'success', message: 'Family profile removed' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MEDICATION ADHERENCE
// ==========================================
const getTodayMedications = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const meds = await prisma.medicationAdherence.findMany({
      where: { patientId: patient.id, date: { gte: start, lte: end } },
      orderBy: { scheduledTime: 'asc' }
    });

    res.status(200).json({ status: 'success', data: { medications: meds } });
  } catch (error) {
    next(error);
  }
};

const markMedicationTaken = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const updated = await prisma.medicationAdherence.update({
      where: { id: req.params.id },
      data: { isTaken: true, takenAt: new Date() }
    });

    res.status(200).json({ status: 'success', data: { medication: updated } });
  } catch (error) {
    next(error);
  }
};

const addMedicationSchedule = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    const { medicineName, dosage, scheduledTime, date, notes } = req.body;

    const med = await prisma.medicationAdherence.create({
      data: {
        patientId: patient.id,
        medicineName,
        dosage,
        scheduledTime,
        date: date ? new Date(date) : new Date(),
        notes
      }
    });

    res.status(201).json({ status: 'success', data: { medication: med } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getHealthTimeline,
  getPrescriptions,
  getOPDStatus,
  getAppointments,
  bookAppointment,
  cancelAppointment,
  getAdmissionStatus,
  getVitals,
  logVital,
  getSymptomDiary,
  addSymptomEntry,
  getDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
  submitFeedback,
  getInsurance,
  upsertInsurance,
  getFamilyProfiles,
  addFamilyProfile,
  deleteFamilyProfile,
  getTodayMedications,
  markMedicationTaken,
  addMedicationSchedule
};
