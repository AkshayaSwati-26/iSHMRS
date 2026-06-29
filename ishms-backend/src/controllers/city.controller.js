const prisma = require('../config/prisma');

const syncHospitalData = async (req, res, next) => {
  try {
    const { hospitalCode, availableBeds, occupiedBeds, queueSize, medicineShortages, emergencyAlerts } = req.body;

    const hospital = await prisma.hospital.findUnique({
      where: { code: hospitalCode }
    });

    if (!hospital) {
      return res.status(404).json({
        status: 'error',
        message: `Hospital with code ${hospitalCode} not registered in City health network`
      });
    }

    const payload = {
      availableBeds,
      occupiedBeds,
      queueSize,
      medicineShortages,
      emergencyAlerts
    };

    const syncRecord = await prisma.hospitalSync.create({
      data: {
        hospitalId: hospital.id,
        syncStatus: 'SUCCESS',
        payload
      }
    });

    // Broadcast global updates
    const { broadcast } = require('../config/socket');
    broadcast(null, 'city_dashboard_updated', { hospitalId: hospital.id, payload });

    res.status(200).json({
      status: 'success',
      message: 'Hospital metrics successfully synced with City Health portal',
      data: { syncRecord }
    });
  } catch (error) {
    next(error);
  }
};

const getCityOverview = async (req, res, next) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { deletedAt: null }
    });

    const overview = [];

    for (const h of hospitals) {
      // Find latest sync record
      const latestSync = await prisma.hospitalSync.findFirst({
        where: { hospitalId: h.id },
        orderBy: { createdAt: 'desc' }
      });

      overview.push({
        id: h.id,
        name: h.name,
        code: h.code,
        address: h.address,
        phone: h.phone,
        lastSyncedAt: latestSync?.lastSyncedAt || null,
        metrics: latestSync?.payload || {
          availableBeds: 0,
          occupiedBeds: 0,
          queueSize: 0,
          medicineShortages: 0,
          emergencyAlerts: 0
        }
      });
    }

    // Rank hospitals by load (lower queue size and higher bed availability = higher rank/score)
    overview.sort((a, b) => {
      const scoreA = (a.metrics.availableBeds * 2) - a.metrics.queueSize;
      const scoreB = (b.metrics.availableBeds * 2) - b.metrics.queueSize;
      return scoreB - scoreA; // sort descending (higher score first)
    });

    res.status(200).json({
      status: 'success',
      data: {
        hospitals: overview,
        cityWideTotals: {
          totalBedsAvailable: overview.reduce((acc, h) => acc + (h.metrics.availableBeds || 0), 0),
          totalBedsOccupied: overview.reduce((acc, h) => acc + (h.metrics.occupiedBeds || 0), 0),
          totalQueueLoad: overview.reduce((acc, h) => acc + (h.metrics.queueSize || 0), 0),
          totalShortages: overview.reduce((acc, h) => acc + (h.metrics.medicineShortages || 0), 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncHospitalData,
  getCityOverview
};
