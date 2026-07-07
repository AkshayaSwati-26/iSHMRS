const prisma = require('../config/prisma');

const getDashboardStats = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    if (!hospitalId) {
      return res.status(400).json({
        status: 'error',
        message: 'Hospital ID not associated with user'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Basic Counts
    const totalPatients = await prisma.patient.count({
      where: { deletedAt: null }
    });

    const todaysPatients = await prisma.oPDToken.count({
      where: {
        createdAt: { gte: today },
        department: { hospitalId }
      }
    });

    const activeAdmissions = await prisma.admission.count({
      where: {
        status: 'Admitted',
        department: { hospitalId }
      }
    });

    const dischargesToday = await prisma.admission.count({
      where: {
        status: 'Discharged',
        updatedAt: { gte: today },
        department: { hospitalId }
      }
    });

    // 2. Bed metrics
    const occupiedBeds = await prisma.bed.count({
      where: {
        status: 'Occupied',
        room: { ward: { department: { hospitalId } } }
      }
    });

    const availableBeds = await prisma.bed.count({
      where: {
        status: 'Available',
        room: { ward: { department: { hospitalId } } }
      }
    });

    const cleaningBeds = await prisma.bed.count({
      where: {
        status: 'Cleaning',
        room: { ward: { department: { hospitalId } } }
      }
    });

    const maintenanceBeds = await prisma.bed.count({
      where: {
        status: 'Maintenance',
        room: { ward: { department: { hospitalId } } }
      }
    });

    // 3. Medicine metrics
    const totalMedicines = await prisma.medicine.count({
      where: { hospitalId, deletedAt: null }
    });

    const expiredMedicines = await prisma.medicine.count({
      where: {
        hospitalId,
        expiryDate: { lt: new Date() },
        deletedAt: null
      }
    });

    // Prisma 7 raw query for low stock
    const lowStockCountRes = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count 
      FROM "Medicine" 
      WHERE "stock_quantity" < "threshold_quantity" 
        AND "deleted_at" IS NULL 
        AND "hospital_id" = ${hospitalId};
    `;
    const lowStockMedicines = lowStockCountRes[0]?.count || 0;

    // 4. OPD Queue metrics
    const opdQueueLength = await prisma.oPDToken.count({
      where: {
        status: 'Waiting',
        department: { hospitalId }
      }
    });

    const emergencyCases = await prisma.oPDToken.count({
      where: {
        status: 'Waiting',
        priority: 'Emergency',
        department: { hospitalId }
      }
    });

    // 5. Charts Data
    // Bed Occupancy by Ward type
    const beds = await prisma.bed.findMany({
      where: { room: { ward: { department: { hospitalId } } } },
      select: { type: true, status: true }
    });

    const bedOccupancyByType = {};
    beds.forEach(b => {
      if (!bedOccupancyByType[b.type]) {
        bedOccupancyByType[b.type] = { total: 0, occupied: 0 };
      }
      bedOccupancyByType[b.type].total++;
      if (b.status === 'Occupied') {
        bedOccupancyByType[b.type].occupied++;
      }
    });

    const bedOccupancyChart = Object.keys(bedOccupancyByType).map(key => ({
      name: key,
      total: bedOccupancyByType[key].total,
      occupied: bedOccupancyByType[key].occupied,
      available: bedOccupancyByType[key].total - bedOccupancyByType[key].occupied
    }));

    // Department-wise patient loading (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const depts = await prisma.department.findMany({
      where: { hospitalId },
      include: {
        _count: {
          select: {
            opdTokens: { where: { createdAt: { gte: thirtyDaysAgo } } }
          }
        }
      }
    });

    const departmentChart = depts.map(d => ({
      name: d.name.replace(' Department', '').replace(' Medicine', ''),
      patientCount: d._count.opdTokens
    }));

    // 7 Days Patient Footfall Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTokens = await prisma.oPDToken.findMany({
      where: {
        department: { hospitalId },
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const footfallTrend = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      footfallTrend[dateStr] = 0;
    }

    recentTokens.forEach(t => {
      const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (footfallTrend[dateStr] !== undefined) {
        footfallTrend[dateStr]++;
      }
    });

    const trendChart = Object.keys(footfallTrend).map(key => ({
      date: key,
      count: footfallTrend[key]
    }));

    // OPD Priority breakdown
    const opdPriorityCounts = await prisma.oPDToken.groupBy({
      by: ['priority'],
      where: {
        createdAt: { gte: today },
        department: { hospitalId }
      },
      _count: { id: true }
    });

    const opdPriorityChart = opdPriorityCounts.map(c => ({
      name: c.priority,
      value: c._count.id
    }));

    res.status(200).json({
      status: 'success',
      data: {
        widgets: {
          totalPatients,
          todaysPatients,
          activeAdmissions,
          dischargesToday,
          occupiedBeds,
          availableBeds,
          cleaningBeds,
          maintenanceBeds,
          totalMedicines,
          lowStockMedicines,
          expiredMedicines,
          opdQueueLength,
          emergencyCases
        },
        charts: {
          bedOccupancy: bedOccupancyChart,
          departmentLoad: departmentChart,
          patientFootfall: trendChart,
          opdPriority: opdPriorityChart
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
