import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CLIENT_URL } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import route modules
import authRoutes from './routes/auth.routes.js';
import departmentsRoutes from './routes/departments.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import queueRoutes from './routes/queue.routes.js';
import bloodRoutes from './routes/blood.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediQueue API server is operational and healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404 and Forward to Central Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
