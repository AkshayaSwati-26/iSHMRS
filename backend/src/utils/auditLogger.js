const prisma = require('../config/prisma');
const logger = require('./logger');

const auditLog = async (userId, action, details = {}, ipAddress = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress
      }
    });
    logger.info(`Audit logged: ${action} by user ${userId || 'SYSTEM'}`);
  } catch (error) {
    logger.error(`Failed to write audit log for action ${action}`, error);
  }
};

module.exports = auditLog;
