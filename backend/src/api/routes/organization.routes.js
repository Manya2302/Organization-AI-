// ============================================================
// Routes: Organization Management
// ============================================================
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { query } from '../../infrastructure/database/connection.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

// GET /profile — Get organization info
router.get('/profile', async (req, res) => {
  const result = await query('SELECT * FROM organizations WHERE id = $1', [req.organizationId]);
  if (!result.rows[0]) throw createError('Organization not found.', 404);
  res.json({ success: true, organization: result.rows[0] });
});

// PATCH /profile — Update organization settings
router.patch('/profile', authorize('SuperAdmin', 'EnterpriseAdmin'), async (req, res) => {
  const { name, companyType, industry, contactNumber, address, city, state } = req.body;
  const result = await query(
    `UPDATE organizations SET name=COALESCE($1,name), company_type=COALESCE($2,company_type),
     industry=COALESCE($3,industry), contact_number=COALESCE($4,contact_number),
     address=COALESCE($5,address), city=COALESCE($6,city), state=COALESCE($7,state), updated_at=NOW()
     WHERE id = $8 RETURNING *`,
    [name, companyType, industry, contactNumber, address, city, state, req.organizationId]
  );
  res.json({ success: true, organization: result.rows[0] });
});

// GET /stats — Organization-level statistics
router.get('/stats', authorize('SuperAdmin', 'EnterpriseAdmin', 'DepartmentManager'), async (req, res) => {
  const [docStats, userStats, storageStats] = await Promise.all([
    query('SELECT COUNT(*) as total, SUM(file_size) as total_bytes FROM documents WHERE organization_id = $1 AND is_deleted = FALSE', [req.organizationId]),
    query("SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active FROM users WHERE organization_id = $1 AND role != 'SuperAdmin'", [req.organizationId]),
    query('SELECT category, COUNT(*) as count, SUM(file_size) as bytes FROM documents WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY category', [req.organizationId])
  ]);

  res.json({
    success: true,
    stats: {
      documents: {
        total: parseInt(docStats.rows[0]?.total) || 0,
        totalSizeBytes: parseInt(docStats.rows[0]?.total_bytes) || 0
      },
      users: {
        total: parseInt(userStats.rows[0]?.total) || 0,
        active: parseInt(userStats.rows[0]?.active) || 0
      },
      storageByCategory: storageStats.rows
    }
  });
});

export default router;
