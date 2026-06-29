const prisma = require('../config/prisma');

// Fetch all appointments with optional filters
const getAppointments = async (req, res, next) => {
  try {
    const { doctorId, patientId, date, status } = req.query;
    const where = { deletedAt: null };

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        department: true
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new appointment
const createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, departmentId, appointmentDate, timeSlot, notes } = req.body;

    if (!patientId || !doctorId || !departmentId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient, doctor, department, date, and time slot are required'
      });
    }

    const apptDateObj = new Date(appointmentDate);
    apptDateObj.setHours(12, 0, 0, 0); // Normalize time to avoid timezone offsets

    // 1. Conflict Check: check if the doctor already has a scheduled appointment in this slot
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: apptDateObj,
        timeSlot,
        status: 'Scheduled',
        deletedAt: null
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        status: 'error',
        message: 'This doctor is already scheduled for an appointment at this time slot'
      });
    }

    // 2. Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        departmentId,
        appointmentDate: apptDateObj,
        timeSlot,
        notes,
        status: 'Scheduled'
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        department: true
      }
    });

    // 3. Broadcast real-time Socket.IO notification
    const { broadcast } = require('../config/socket');
    broadcast(null, 'appointment_created', { appointment });

    res.status(201).json({
      status: 'success',
      message: 'Appointment scheduled successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// Reschedule or update appointment status
const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appointmentDate, timeSlot, status, notes } = req.body;

    const currentAppt = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!currentAppt) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    if (appointmentDate && timeSlot) {
      const apptDateObj = new Date(appointmentDate);
      apptDateObj.setHours(12, 0, 0, 0); // Normalize

      // Check conflict for new rescheduled slot
      const existingBooking = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          doctorId: currentAppt.doctorId,
          appointmentDate: apptDateObj,
          timeSlot,
          status: 'Scheduled',
          deletedAt: null
        }
      });

      if (existingBooking) {
        return res.status(400).json({
          status: 'error',
          message: 'The doctor already has another booking in this time slot'
        });
      }

      data.appointmentDate = apptDateObj;
      data.timeSlot = timeSlot;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        department: true
      }
    });

    const { broadcast } = require('../config/socket');
    broadcast(null, 'appointment_updated', { appointment });

    res.status(200).json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// Delete/Cancel an appointment
const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'Cancelled'
      }
    });

    const { broadcast } = require('../config/socket');
    broadcast(null, 'appointment_deleted', { id });

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
