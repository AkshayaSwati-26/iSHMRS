const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error on ${req.method} ${req.url}: ${err.message}`, err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    // Unique key violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: `Unique constraint violation: ${err.meta?.target?.join(', ') || 'Duplicate entry'}`
      });
    }

    // Foreign key violation
    if (err.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid reference. Foreign key constraint failed.'
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: err.meta?.cause || 'Record not found'
      });
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
