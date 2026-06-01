// ============================================================
// API Middleware: Global Error Handler
// ============================================================
import { logger } from '../../infrastructure/logging/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { url: req.originalUrl, method: req.method, stack: err.stack });

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_ENTRY'
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentication token expired. Please log in again.' });
  }

  // Multer file errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File size exceeds limit of ${process.env.MAX_FILE_SIZE_MB || 50}MB.`
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, errors: err.details });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Create HTTP error helper
export const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
