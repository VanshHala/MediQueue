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

// Allow configured CLIENT_URL, Vercel deployments, and local development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  CLIENT_URL?.replace(/\/+$/, '')
].filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);
      // Allow any Vercel domain or Render preview domain
      if (/\.vercel\.app$/.test(new URL(origin).hostname)) return callback(null, true);
      if (/\.onrender\.com$/.test(new URL(origin).hostname)) return callback(null, true);
      // Fallback allow in production to prevent unexpected cross-origin blocks
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check for Render & uptime monitors
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'MediQueue API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Dedicated API health check
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
