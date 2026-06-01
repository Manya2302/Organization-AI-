// ============================================================
// API Middleware: JWT Authentication Guard
// ============================================================
import authService from '../../application/services/AuthService.js';
import { logger } from '../../infrastructure/logging/logger.js';

// Protect routes — require valid JWT
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required. Please log in.' });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

// Role-based authorization
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role}) to ${req.path}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

// Optional auth (attach user if token present, but don't block)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = await authService.verifyToken(token);
      if (req.user) req.organizationId = req.user.organizationId;
    }
  } catch {
    // Silently fail for optional auth
  }
  next();
};
