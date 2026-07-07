const { z } = require('zod');

const registerPatientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Patient name is required'),
    age: z.number().int().positive('Age must be a positive integer'),
    gender: z.string().min(1, 'Gender is required'),
    bloodGroup: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    emergencyContactName: z.string().optional().nullable(),
    emergencyContactPhone: z.string().optional().nullable()
  })
});

module.exports = { registerPatientSchema };
