const { z } = require('zod');

const generateTokenSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    departmentId: z.string().uuid('Invalid department ID'),
    doctorId: z.string().uuid('Invalid doctor ID').optional().nullable(),
    priority: z.enum(['Normal', 'Emergency', 'SeniorCitizen', 'Pregnancy']).default('Normal')
  })
});

const updateTokenStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Waiting', 'InConsultation', 'Completed', 'Cancelled', 'NoShow'])
  }),
  params: z.object({
    id: z.string().uuid('Invalid token ID')
  })
});

module.exports = {
  generateTokenSchema,
  updateTokenStatusSchema
};
