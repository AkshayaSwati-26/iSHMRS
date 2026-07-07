const { z } = require('zod');

const createMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Medicine name is required'),
    genericName: z.string().min(1, 'Generic name is required'),
    batchNumber: z.string().min(1, 'Batch number is required'),
    manufacturer: z.string().min(1, 'Manufacturer is required'),
    purchaseDate: z.string().optional().nullable(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
    unitPrice: z.number().positive('Unit price must be positive'),
    stockQuantity: z.number().int().nonnegative('Stock quantity cannot be negative'),
    thresholdQuantity: z.number().int().nonnegative('Threshold quantity cannot be negative')
  })
});

const updateMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    genericName: z.string().min(1).optional(),
    batchNumber: z.string().min(1).optional(),
    manufacturer: z.string().min(1).optional(),
    purchaseDate: z.string().optional().nullable(),
    expiryDate: z.string().optional(),
    unitPrice: z.number().positive().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    thresholdQuantity: z.number().int().nonnegative().optional()
  }),
  params: z.object({
    id: z.string().uuid('Invalid medicine ID')
  })
});

const updateStockSchema = z.object({
  body: z.object({
    quantity: z.number().int().refine(val => val !== 0, { message: 'Quantity must be a non-zero integer' }),
    type: z.enum(['StockIn', 'StockOut', 'StockTransfer', 'StockAudit']),
    remarks: z.string().optional().nullable()
  }),
  params: z.object({
    id: z.string().uuid('Invalid medicine ID')
  })
});

module.exports = {
  createMedicineSchema,
  updateMedicineSchema,
  updateStockSchema
};
