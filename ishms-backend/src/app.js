const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ✅ 1. Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Adjust in production to frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per window
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// ✅ 2. Utility Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ✅ 3. Import Routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const opdRoutes = require('./routes/opd.routes');
const consultationRoutes = require('./routes/consultation.routes');
const admissionRoutes = require('./routes/admission.routes');
const bedRoutes = require('./routes/bed.routes');
const medicineRoutes = require('./routes/medicine.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const alertRoutes = require('./routes/alert.routes');
const reportRoutes = require('./routes/report.routes');
const cityRoutes = require('./routes/city.routes');
const appointmentRoutes = require('./routes/appointment.routes');

// ✅ 4. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/city', cityRoutes);
app.use('/api/appointments', appointmentRoutes);

// ✅ 5. 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// ✅ 6. Global Error Handler
app.use(errorHandler);

module.exports = app;
