const prisma = require('../config/prisma');
const auditLog = require('../utils/auditLogger');
const { broadcast } = require('../config/socket');

const getAlerts = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const alerts = await prisma.alert.findMany({
      where: {
        hospitalId,
        status: { in: ['Active', 'Acknowledged'] },
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

const acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Acknowledged or Resolved
    const hospitalId = req.user.hospitalId;

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        status,
        deletedAt: status === 'Resolved' ? new Date() : null
      }
    });

    await auditLog(req.user.id, 'ALERT_UPDATED', { alertId: id, status }, req.ip);

    broadcast(hospitalId, 'dashboard_updated');

    res.status(200).json({
      status: 'success',
      data: { alert: updatedAlert }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  acknowledgeAlert
};
