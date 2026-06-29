const { z } = require('zod');

const createBedSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Bed label is required'),
    roomId: z.string().uuid('Invalid room ID'),
    type: z.enum(['General', 'ICU', 'Emergency', 'Isolation', 'Maternity', 'OperationRecovery']),
    status: z.enum(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance', 'TransferPending']).default('Available')
  })
});

const updateBedStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance', 'TransferPending'])
  }),
  params: z.object({
    id: z.string().uuid('Invalid bed ID')
  })
});

module.exports = {
  createBedSchema,
  updateBedStatusSchema
};
