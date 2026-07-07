const prisma = require('../config/prisma');
const { broadcast } = require('../config/socket');
const auditLog = require('../utils/auditLogger');

const getMedicines = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    // Auto-check for expiry alerts upon fetching medicines
    const today = new Date();
    const medicines = await prisma.medicine.findMany({
      where: { hospitalId, deletedAt: null },
      orderBy: { name: 'asc' }
    });

    // Process expiry alerts in the background
    for (const med of medicines) {
      if (new Date(med.expiryDate) < today) {
        // Create an expiry alert if it doesn't already exist
        const alertExists = await prisma.alert.findFirst({
          where: {
            hospitalId,
            type: 'MedicineExpiry',
            message: { contains: med.name },
            status: 'Active'
          }
        });

        if (!alertExists) {
          await prisma.alert.create({
            data: {
              type: 'MedicineExpiry',
              severity: 'Critical',
              message: `Medicine Expired: ${med.name} (Batch: ${med.batchNumber}) has expired on ${new Date(med.expiryDate).toLocaleDateString()}`,
              status: 'Active',
              hospitalId
            }
          });
          broadcast(hospitalId, 'medicine_expired', med);
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: { medicines }
    });
  } catch (error) {
    next(error);
  }
};

const addMedicine = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      batchNumber,
      manufacturer,
      purchaseDate,
      expiryDate,
      unitPrice,
      stockQuantity,
      thresholdQuantity
    } = req.body;
    const hospitalId = req.user.hospitalId;

    const medicine = await prisma.$transaction(async (tx) => {
      // 1. Create Medicine
      const med = await tx.medicine.create({
        data: {
          name,
          genericName,
          batchNumber,
          manufacturer,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          expiryDate: new Date(expiryDate),
          unitPrice,
          stockQuantity,
          thresholdQuantity,
          hospitalId
        }
      });

      // 2. Create Initial Stock-In transaction
      await tx.inventoryTransaction.create({
        data: {
          medicineId: med.id,
          quantity: stockQuantity,
          type: 'StockIn',
          remarks: 'Initial inventory entry',
          createdById: req.user.id
        }
      });

      // 3. Auto alert check
      if (stockQuantity < thresholdQuantity) {
        await tx.alert.create({
          data: {
            type: 'LowStock',
            severity: 'High',
            message: `Low Stock: ${med.name} (Batch: ${med.batchNumber}) is below threshold limit. Current: ${stockQuantity}, Threshold: ${thresholdQuantity}`,
            status: 'Active',
            hospitalId
          }
        });
      }

      return med;
    });

    await auditLog(req.user.id, 'MEDICINE_ADDED', { name: medicine.name, batchNumber, stockQuantity }, req.ip);

    broadcast(hospitalId, 'dashboard_updated');

    res.status(201).json({
      status: 'success',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

const updateMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const data = { ...req.body };
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);

    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data
    });

    await auditLog(req.user.id, 'MEDICINE_UPDATED', { medicineId: id, name: updatedMedicine.name }, req.ip);

    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { medicine: updatedMedicine }
    });
  } catch (error) {
    next(error);
  }
};

const deleteMedicine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user.hospitalId;

    const med = await prisma.medicine.findUnique({
      where: { id }
    });

    if (!med) {
      return res.status(404).json({
        status: 'error',
        message: 'Medicine not found'
      });
    }

    // Deletion allowed only if stock is zero or expired
    const isExpired = new Date(med.expiryDate) < new Date();
    if (med.stockQuantity > 0 && !isExpired) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete active medicine with remaining stock'
      });
    }

    const deleted = await prisma.medicine.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await auditLog(req.user.id, 'MEDICINE_DELETED', { name: med.name }, req.ip);

    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      message: 'Medicine removed successfully',
      data: { medicine: deleted }
    });
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params; // medicine ID
    const { quantity, type, remarks } = req.body; // quantity can be positive or negative
    const hospitalId = req.user.hospitalId;

    const med = await prisma.medicine.findUnique({
      where: { id }
    });

    if (!med) {
      return res.status(404).json({
        status: 'error',
        message: 'Medicine not found'
      });
    }

    const newStock = med.stockQuantity + quantity;
    if (newStock < 0) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient stock. Current: ${med.stockQuantity}, requested reduction: ${Math.abs(quantity)}`
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          medicineId: id,
          quantity,
          type,
          remarks,
          createdById: req.user.id
        }
      });

      // 2. Update Stock quantity
      const updatedMed = await tx.medicine.update({
        where: { id },
        data: { stockQuantity: newStock }
      });

      // 3. Alert checks
      if (newStock < med.thresholdQuantity) {
        // Create alert if not exists
        const alertExists = await tx.alert.findFirst({
          where: {
            hospitalId,
            type: 'LowStock',
            message: { contains: med.name },
            status: 'Active'
          }
        });

        if (!alertExists) {
          await tx.alert.create({
            data: {
              type: 'LowStock',
              severity: 'High',
              message: `Low Stock Alert: ${med.name} (Batch: ${med.batchNumber}) is below the threshold limit. Current: ${newStock}, Threshold: ${med.thresholdQuantity}`,
              status: 'Active',
              hospitalId
            }
          });
          broadcast(hospitalId, 'medicine_low_stock', updatedMed);
        }
      } else {
        // Resolve active low stock alerts if stock goes back up
        await tx.alert.updateMany({
          where: {
            hospitalId,
            type: 'LowStock',
            message: { contains: med.name },
            status: 'Active'
          },
          data: { status: 'Resolved', deletedAt: new Date() }
        });
      }

      return { transaction, medicine: updatedMed };
    });

    await auditLog(req.user.id, 'MEDICINE_STOCK_UPDATED', { name: med.name, change: quantity, newStock }, req.ip);

    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      message: 'Stock updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        medicine: { hospitalId }
      },
      include: {
        medicine: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    res.status(200).json({
      status: 'success',
      data: { transactions }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getTransactions
};
