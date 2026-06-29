const prisma = require('../config/prisma');

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

    // Simulate PDF generation and save report record
    const mockFileUrl = `/reports/mock-download-${type.toLowerCase()}-${Date.now()}.pdf`;

    const report = await prisma.report.create({
      data: {
        title,
        type,
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
