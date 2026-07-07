const { z } = require('zod');

const admitPatientSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    departmentId: z.string().uuid('Invalid department ID'),
    doctorId: z.string().uuid('Invalid doctor ID'),
    bedId: z.string().uuid('Invalid bed ID')
  })
});

const dischargePatientSchema = z.object({
  body: z.object({
    reason: z.string().optional().nullable(),
    summary: z.string().optional().nullable()
  }),
  params: z.object({
    id: z.string().uuid('Invalid admission ID')
  })
});

module.exports = {
  admitPatientSchema,
  dischargePatientSchema
};
