const prisma = require('../config/prisma');
const socketConfig = require('../config/socket');
const auditLog = require('../utils/auditLogger');

// Generate unique Order Number: LAB-YYYYMMDD-XXXX
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LAB-${date}-${rand}`;
};

// Get Catalog of all Lab Tests
const getLabCatalog = async (req, res, next) => {
  try {
    const tests = await prisma.labTest.findMany({
      where: { deletedAt: null },
      orderBy: { category: 'asc' }
    });
    res.status(200).json({ status: 'success', data: { tests } });
  } catch (error) {
    next(error);
  }
};

// Create Lab Order (Doctor ordering tests for patient)
const createLabOrder = async (req, res, next) => {
  try {
    const { patientId, consultationId, admissionId, testIds, priority = 'Routine', notes } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    if (!testIds || testIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please select at least one lab test' });
    }

    const orderNumber = generateOrderNumber();
    const items = testIds.map(testId => ({ labTestId: testId }));

    const labOrder = await prisma.labOrder.create({
      data: {
        orderNumber,
        patientId,
        consultationId,
        admissionId,
        orderedById: req.user.id,
        priority,
        notes,
        items: { create: items }
      },
      include: {
        patient: true,
        orderedBy: { select: { firstName: true, lastName: true } },
        items: { include: { labTest: true } }
      }
    });

    await auditLog(req.user.id, 'LAB_ORDER_CREATED', { orderNumber, patientId }, req.ip);

    // Broadcast socket alert if STAT/Urgent
    if (priority === 'STAT' || priority === 'Urgent') {
      socketConfig.broadcast(null, 'lab_stat_order', {
        orderNumber,
        patientName: patient.name,
        priority
      });
    }

    res.status(201).json({ status: 'success', data: { labOrder } });
  } catch (error) {
    next(error);
  }
};

// Get Lab Orders List (Lab Tech / Doctor / Admin view)
const getLabOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const orders = await prisma.labOrder.findMany({
      where: {
        deletedAt: null,
        ...(status && { status }),
        ...(search && {
          OR: [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { patient: { name: { contains: search, mode: 'insensitive' } } },
            { patient: { uhid: { contains: search, mode: 'insensitive' } } }
          ]
        })
      },
      include: {
        patient: { select: { name: true, uhid: true, age: true, gender: true } },
        orderedBy: { select: { firstName: true, lastName: true } },
        items: { include: { labTest: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { orders } });
  } catch (error) {
    next(error);
  }
};

// Mark Sample Collected (Lab Tech)
const updateSampleCollection = async (req, res, next) => {
  try {
    const { id } = req.params; // LabOrder ID

    const labOrder = await prisma.labOrder.findUnique({ where: { id } });
    if (!labOrder) return res.status(404).json({ status: 'error', message: 'Lab order not found' });

    const updated = await prisma.$transaction([
      prisma.labOrderItem.updateMany({
        where: { labOrderId: id },
        data: { sampleCollectedAt: new Date() }
      }),
      prisma.labOrder.update({
        where: { id },
        data: { status: 'SampleCollected' },
        include: { patient: true, items: { include: { labTest: true } } }
      })
    ]);

    res.status(200).json({ status: 'success', data: { labOrder: updated[1] } });
  } catch (error) {
    next(error);
  }
};

// Enter Lab Results (Lab Tech entering test values)
const enterLabResults = async (req, res, next) => {
  try {
    const { id } = req.params; // LabOrder ID
    const { items } = req.body; // Array of [{ itemId, resultValue, resultUnit, isAbnormal, isCritical, resultNotes }]

    if (!items || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No result items provided' });
    }

    let hasCritical = false;

    // Update each test result item
    for (const item of items) {
      if (item.isCritical) hasCritical = true;

      await prisma.labOrderItem.update({
        where: { id: item.itemId },
        data: {
          resultValue: item.resultValue,
          resultUnit: item.resultUnit,
          isAbnormal: item.isAbnormal || false,
          isCritical: item.isCritical || false,
          resultNotes: item.resultNotes,
          resultedAt: new Date(),
          resultedById: req.user.id
        }
      });
    }

    const updatedOrder = await prisma.labOrder.update({
      where: { id },
      data: { status: 'Resulted' },
      include: {
        patient: true,
        orderedBy: { select: { firstName: true, lastName: true } },
        items: { include: { labTest: true } }
      }
    });

    await auditLog(req.user.id, 'LAB_RESULTS_ENTERED', { labOrderId: id, orderNumber: updatedOrder.orderNumber }, req.ip);

    // Critical Value Push Alert via Socket.io
    if (hasCritical) {
      socketConfig.broadcast(null, 'lab_critical_alert', {
        orderNumber: updatedOrder.orderNumber,
        patientName: updatedOrder.patient.name,
        uhid: updatedOrder.patient.uhid,
        message: `🚨 CRITICAL LAB VALUE DETECTED for ${updatedOrder.patient.name} (${updatedOrder.orderNumber})!`
      });
    }

    res.status(200).json({ status: 'success', data: { labOrder: updatedOrder } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLabCatalog,
  createLabOrder,
  getLabOrders,
  updateSampleCollection,
  enterLabResults
};
