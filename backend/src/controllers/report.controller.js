const prisma = require('../config/prisma');

const VALID_TYPES = [
  'Daily',
  'Weekly',
  'Monthly',
  'Department',
  'BedUtilization',
  'MedicineConsumption',
  'PatientStats',
  'OPD_Performance',
  'Bed_Occupancy',
  'Inventory_Status',
  'Audit_Log'
];

const getReports = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      include: { generatedBy: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const { title, type } = req.body;
    const userId = req.user.id;

    // Map or sanitize report type to valid enum value
    let reportType = type || 'OPD_Performance';
    if (!VALID_TYPES.includes(reportType)) {
      if (reportType.toLowerCase().includes('opd')) reportType = 'OPD_Performance';
      else if (reportType.toLowerCase().includes('bed')) reportType = 'Bed_Occupancy';
      else if (reportType.toLowerCase().includes('inventory')) reportType = 'Inventory_Status';
      else if (reportType.toLowerCase().includes('audit')) reportType = 'Audit_Log';
      else reportType = 'Department';
    }

    // Simulate PDF generation and save report record
    const mockFileUrl = `/reports/mock-download-${reportType.toLowerCase()}-${Date.now()}.pdf`;

    const report = await prisma.report.create({
      data: {
        title,
        type: reportType,
        fileUrl: mockFileUrl,
        generatedById: userId
      },
      include: { generatedBy: true }
    });

    res.status(201).json({
      status: 'success',
      message: 'Report generated successfully',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  generateReport
};
