const prisma = require('../config/prisma');
const auditLog = require('../utils/auditLogger');

// Generate unique Bill Number: BILL-YYYYMMDD-XXXX
const generateBillNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${date}-${rand}`;
};

// Create OPD Bill (Consultation + Medicines)
const createOPDBill = async (req, res, next) => {
  try {
    const { patientId, consultationId, items, taxAmount = 0, discountAmount = 0, notes } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ status: 'error', message: 'Patient not found' });

    let subtotal = 0;
    const formattedItems = (items || []).map(item => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        type: item.type || 'Consultation',
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: total
      };
    });

    const totalAmount = Math.max(0, subtotal + parseFloat(taxAmount) - parseFloat(discountAmount));
    const billNumber = generateBillNumber();

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        patientId,
        consultationId,
        status: 'Generated',
        subtotal,
        taxAmount: parseFloat(taxAmount),
        discountAmount: parseFloat(discountAmount),
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        notes,
        generatedById: req.user.id,
        items: { create: formattedItems }
      },
      include: {
        patient: true,
        items: true
      }
    });

    await auditLog(req.user.id, 'BILL_GENERATED', { billNumber, patientId, totalAmount }, req.ip);
    res.status(201).json({ status: 'success', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// Create IPD Admission Bill (Bed charges + Procedures + Medicines)
const createIPDBill = async (req, res, next) => {
  try {
    const { patientId, admissionId, items, taxAmount = 0, discountAmount = 0, notes } = req.body;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { bed: { include: { room: { include: { ward: true } } } } }
    });

    if (!admission) return res.status(404).json({ status: 'error', message: 'Admission record not found' });

    // Calculate days admitted
    const admitDate = new Date(admission.admittedAt);
    const now = new Date();
    const daysAdmitted = Math.max(1, Math.ceil((now - admitDate) / (1000 * 60 * 60 * 24)));
    const dailyBedCharge = 1500; // standard daily bed charge

    let subtotal = daysAdmitted * dailyBedCharge;
    const formattedItems = [
      {
        type: 'Bed',
        description: `Ward Bed Charge (${admission.bed?.label} - ${admission.bed?.room?.ward?.name}) x ${daysAdmitted} Days`,
        quantity: daysAdmitted,
        unitPrice: dailyBedCharge,
        totalPrice: daysAdmitted * dailyBedCharge
      },
      ...(items || []).map(item => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        return {
          type: item.type || 'Procedure',
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: total
        };
      })
    ];

    const totalAmount = Math.max(0, subtotal + parseFloat(taxAmount) - parseFloat(discountAmount));
    const billNumber = generateBillNumber();

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        patientId,
        admissionId,
        status: 'Generated',
        subtotal,
        taxAmount: parseFloat(taxAmount),
        discountAmount: parseFloat(discountAmount),
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        notes,
        generatedById: req.user.id,
        items: { create: formattedItems }
      },
      include: {
        patient: true,
        items: true
      }
    });

    await auditLog(req.user.id, 'IPD_BILL_GENERATED', { billNumber, admissionId, totalAmount }, req.ip);
    res.status(201).json({ status: 'success', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// Record Payment Transaction against Bill
const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params; // Bill ID
    const { amount, method = 'Cash', referenceNumber, notes } = req.body;

    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return res.status(404).json({ status: 'error', message: 'Bill not found' });

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) return res.status(400).json({ status: 'error', message: 'Payment amount must be greater than 0' });

    const newPaidAmount = bill.paidAmount + payAmount;
    const newBalance = Math.max(0, bill.totalAmount - newPaidAmount);
    const newStatus = newBalance === 0 ? 'Paid' : 'PartiallyPaid';

    const transaction = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.create({
        data: {
          billId: id,
          amount: payAmount,
          method,
          referenceNumber,
          notes,
          processedById: req.user.id
        }
      });

      const updatedBill = await tx.bill.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          status: newStatus
        },
        include: { patient: true, items: true, payments: true }
      });

      return { payment, updatedBill };
    });

    await auditLog(req.user.id, 'PAYMENT_RECORDED', { billId: id, amount: payAmount, method }, req.ip);
    res.status(200).json({ status: 'success', data: transaction });
  } catch (error) {
    next(error);
  }
};

// Get All Bills (Admin/Staff paginated)
const getBills = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const bills = await prisma.bill.findMany({
      where: {
        deletedAt: null,
        ...(status && { status }),
        ...(search && {
          OR: [
            { billNumber: { contains: search, mode: 'insensitive' } },
            { patient: { name: { contains: search, mode: 'insensitive' } } },
            { patient: { uhid: { contains: search, mode: 'insensitive' } } }
          ]
        })
      },
      include: {
        patient: { select: { name: true, uhid: true, phone: true } },
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { bills } });
  } catch (error) {
    next(error);
  }
};

// Get Bill By ID
const getBillById = async (req, res, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        items: true,
        payments: { include: { processedBy: { select: { firstName: true, lastName: true } } } },
        generatedBy: { select: { firstName: true, lastName: true } }
      }
    });

    if (!bill) return res.status(404).json({ status: 'error', message: 'Bill not found' });
    res.status(200).json({ status: 'success', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// Get Billing Revenue Stats
const getBillingStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayPayments, totalCollected, totalPending] = await Promise.all([
      prisma.paymentTransaction.aggregate({
        where: { processedAt: { gte: today } },
        _sum: { amount: true }
      }),
      prisma.paymentTransaction.aggregate({
        _sum: { amount: true }
      }),
      prisma.bill.aggregate({
        where: { status: { in: ['Generated', 'PartiallyPaid'] } },
        _sum: { balanceAmount: true }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        todayCollected: todayPayments._sum.amount || 0,
        totalCollected: totalCollected._sum.amount || 0,
        totalPending: totalPending._sum.balanceAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOPDBill,
  createIPDBill,
  recordPayment,
  getBills,
  getBillById,
  getBillingStats
};
