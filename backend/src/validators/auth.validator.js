const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long')
  })
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    roleName: z.enum(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST'], {
      errorMap: () => ({ message: 'Invalid role' })
    }),
    hospitalId: z.string().uuid().optional().nullable()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPasswordSchema,
  forgotPasswordSchema
};
