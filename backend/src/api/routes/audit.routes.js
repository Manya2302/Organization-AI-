// ============================================================
// Routes: Security Audit Logs
// ============================================================
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';

const router = Router();
router.use(authenticate);
router.use(authorize('SuperAdmin', 'EnterpriseAdmin', 'DepartmentManager'));

// GET / — Get all audit logs for organization
router.get('/', async (req, res) => {
  const { action, userId, status, dateFrom, dateTo, page = 1, limit = 100 } = req.query;

  const filters = {
    action: action || null,
    userId: userId || null,
    status: status || null,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const logs = await auditRepository.findByOrganization(req.organizationId, filters);
  res.json({ success: true, logs, count: logs.length });
});

// GET /summary — Activity summary for charts
router.get('/summary', async (req, res) => {
  const { days = 30 } = req.query;
  const summary = await auditRepository.getActivitySummary(req.organizationId, parseInt(days));
  res.json({ success: true, summary });
});

export default router;
