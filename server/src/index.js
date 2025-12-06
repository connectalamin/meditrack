import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import prisma from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import familyRoutes from './routes/family.js';
import medicationRoutes from './routes/medications.js';
import reportRoutes from './routes/reports.js';
import healthDataRoutes from './routes/healthData.js';
import planRoutes from './routes/plans.js';
import purchaseListRoutes from './routes/purchaseList.js';
import ocrRoutes from './routes/ocr.js';
import analyticsRoutes from './routes/analytics.js';
import pdfRoutes from './routes/pdf.js';

dotenv.config();

const app = express();

// Trust proxy - Required for Vercel and other proxy services
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', true);

// Middleware - CORS configuration (MUST be before rate limiting)
// Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://meditrack-jade.vercel.app', // Production client
  'https://meditrack-jade.vercel.app/', // Production client with trailing slash
  process.env.CLIENT_URL, // Additional from env
  process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/` : null // With trailing slash
].filter(Boolean); // Remove any undefined values

// Normalize origin (remove trailing slash for comparison)
const normalizeOrigin = (origin) => {
  if (!origin) return null;
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
};

// Add CORS headers to all responses (including OPTIONS) - this runs before everything
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedAllowed = allowedOrigins.map(normalizeOrigin);
  
  // Set CORS headers if origin is allowed
  if (origin && normalizedAllowed.includes(normalizedOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin || (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-device-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedAllowed = allowedOrigins.map(normalizeOrigin);
    
    // Check if origin matches (with or without trailing slash)
    if (normalizedAllowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost variations
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Log for debugging (enable in production to troubleshoot)
    console.log('CORS check - Origin:', origin);
    console.log('CORS check - Normalized:', normalizedOrigin);
    console.log('CORS check - Allowed:', normalizedAllowed);
    
    // Return false instead of error for better compatibility
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-token'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware - MUST be before any other middleware
app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes (critical for preflight requests)
// This MUST be before rate limiting to ensure OPTIONS requests are handled
app.options('*', (req, res) => {
  // Set CORS headers manually for OPTIONS requests
  const origin = req.headers.origin;
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedAllowed = allowedOrigins.map(normalizeOrigin);
  
  if (origin && normalizedAllowed.includes(normalizedOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-device-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// Rate limiting - Skip OPTIONS requests (preflight)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for OPTIONS requests
});

app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MediTrack API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/health-data', healthDataRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/purchase-list', purchaseListRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/pdf', pdfRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Export app for Vercel serverless functions
export default app;

// Only start server if not running on Vercel
// Vercel sets the VERCEL environment variable
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

