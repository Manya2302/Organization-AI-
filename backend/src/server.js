// ============================================================
// SecureVault AI — Main Application Entry Point
// Clean Architecture Node.js Backend
// ============================================================
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

import { logger } from './infrastructure/logging/logger.js';
import { startWorker } from './infrastructure/jobs/DocumentProcessingWorker.js';
import { getQueueStats } from './infrastructure/jobs/AIQueueService.js';
import { connectDB, testConnection } from './infrastructure/database/connection.js';
import { globalErrorHandler } from './api/middleware/errorHandler.js';
import { rateLimiter } from './api/middleware/rateLimiter.js';

// Route Imports
import authRoutes from './api/routes/auth.routes.js';
import documentRoutes from './api/routes/document.routes.js';
import employeeRoutes from './api/routes/employee.routes.js';
import organizationRoutes from './api/routes/organization.routes.js';
import auditRoutes from './api/routes/audit.routes.js';
import aiRoutes from './api/routes/ai.routes.js';
import ocrRoutes from './api/routes/ocr.routes.js';
import searchRoutes from './api/routes/search.routes.js';
import analyticsRoutes from './api/routes/analytics.routes.js';
import intelligenceRoutes from './api/routes/intelligence.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ────────── Security Middleware ──────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-ID', 'X-Request-ID']
}));

// ────────── Core Middleware ──────────
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ────────── Logging ──────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) }
  }));
}

// ────────── Rate Limiting ──────────
app.use('/api/', rateLimiter);

// ────────── Static File Serving (Uploads) ──────────
app.use('/uploads', express.static(join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// ────────── Health Check Endpoint ──────────
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      api: 'running',
      ollama: process.env.OLLAMA_BASE_URL,
      chroma: process.env.CHROMA_BASE_URL
    }
  });
});

// ────────── API Routes ──────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/intelligence', intelligenceRoutes);

// ────────── 404 Handler ──────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server.`,
    hint: 'Check the API documentation at /api/v1/docs'
  });
});

// ────────── Global Error Handler ──────────
app.use(globalErrorHandler);

// ────────── Start Server ──────────
const startServer = async () => {
  try {
    await connectDB();
    startWorker(); // Start AI background processing worker
    logger.info('✅ PostgreSQL database connection established.');

    app.listen(PORT, () => {
      logger.info(`🚀 SecureVault AI Backend running on port ${PORT}`);
      logger.info(`📡 API Base: http://localhost:${PORT}/api/v1`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🤖 Ollama AI: ${process.env.OLLAMA_BASE_URL}`);
      logger.info(`🗄️  ChromaDB: ${process.env.CHROMA_BASE_URL}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
