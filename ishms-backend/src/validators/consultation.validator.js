const { z } = require('zod');

const addConsultationSchema = z.object({
  body: z.object({
    tokenId: z.string().uuid('Invalid token ID'),
    patientId: z.string().uuid('Invalid patient ID'),
    symptoms: z.string().min(1, 'Symptoms are required'),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    vitals: z.object({
      bp: z.string().optional().nullable(),
      heartRate: z.number().int().optional().nullable(),
      temp: z.number().optional().nullable(),
      respRate: z.number().int().optional().nullable(),
      spo2: z.number().int().optional().nullable()
    }).optional().nullable(),
    prescriptions: z.array(
      z.object({
        medicineId: z.string().uuid('Invalid medicine ID'),
        name: z.string().min(1, 'Medicine name is required'),
        dosage: z.string().min(1, 'Dosage is required'),
        duration: z.string().min(1, 'Duration is required'),
        frequency: z.string().min(1, 'Frequency is required')
      })
    ).optional().nullable(),
    labRecommendations: z.array(z.string()).optional().nullable(),
    admissionRecommended: z.boolean().default(false),
    followUpDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  })
});

module.exports = { addConsultationSchema };
