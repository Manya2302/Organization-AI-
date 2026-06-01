// ============================================================
// Infrastructure: Audit Log Repository (PostgreSQL + JSON Fallback)
// ============================================================
import { query, isLocalJSONDb } from '../database/connection.js';
import { readTable, insertRow } from '../database/jsonDb.js';
import { AuditLog } from '../../core/entities/Document.js';

export class AuditRepository {
  // Insert a new audit log entry
  async log({ organizationId, userId, userName, userRole, action, resourceType, resourceId, resourceName, details, metadata, ipAddress, userAgent, status = 'success' }) {
    if (isLocalJSONDb) {
      const logRow = {
        organization_id: organizationId,
        user_id: userId,
        user_name: userName || 'System',
        user_role: userRole || 'System',
        action,
        resource_type: resourceType || null,
        resource_id: resourceId || null,
        resource_name: resourceName || null,
        details: details || null,
        metadata: metadata || {},
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        status
      };
      const inserted = await insertRow('audit_logs', logRow);
      return new AuditLog(inserted);
    }

    const result = await query(
      `INSERT INTO audit_logs (organization_id, user_id, user_name, user_role, action, resource_type, resource_id, resource_name, details, metadata, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [organizationId || null, userId || null, userName || 'System', userRole || 'System', action,
       resourceType || null, resourceId || null, resourceName || null, details || null,
       JSON.stringify(metadata || {}), ipAddress || null, userAgent || null, status]
    );
    return new AuditLog(result.rows[0]);
  }

  // Get audit logs for organization with filters
  async findByOrganization(organizationId, filters = {}) {
    if (isLocalJSONDb) {
      const logs = await readTable('audit_logs');
      let filtered = logs.filter(l => l.organization_id === organizationId);

      if (filters.userId) {
        filtered = filtered.filter(l => l.user_id === filters.userId);
      }
      if (filters.action) {
        const term = filters.action.toLowerCase();
        filtered = filtered.filter(l => l.action && l.action.toLowerCase().includes(term));
      }
      if (filters.resourceType) {
        filtered = filtered.filter(l => l.resource_type === filters.resourceType);
      }
      if (filters.status) {
        filtered = filtered.filter(l => l.status === filters.status);
      }

      // Sort by created_at DESC
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (filters.offset !== undefined && filters.limit !== undefined) {
        return filtered.slice(filters.offset, filters.offset + filters.limit).map(r => new AuditLog(r));
      } else if (filters.limit !== undefined) {
        return filtered.slice(0, filters.limit).map(r => new AuditLog(r));
      }

      return filtered.map(r => new AuditLog(r));
    }

    let sql = 'SELECT * FROM audit_logs WHERE organization_id = $1';
    const params = [organizationId];
    let idx = 2;

    if (filters.userId) { sql += ` AND user_id = $${idx++}`; params.push(filters.userId); }
    if (filters.action) { sql += ` AND action ILIKE $${idx++}`; params.push(`%${filters.action}%`); }
    if (filters.resourceType) { sql += ` AND resource_type = $${idx++}`; params.push(filters.resourceType); }
    if (filters.status) { sql += ` AND status = $${idx++}`; params.push(filters.status); }
    if (filters.dateFrom) { sql += ` AND created_at >= $${idx++}`; params.push(filters.dateFrom); }
    if (filters.dateTo) { sql += ` AND created_at <= $${idx++}`; params.push(filters.dateTo); }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) { sql += ` LIMIT $${idx++}`; params.push(filters.limit); }
    if (filters.offset) { sql += ` OFFSET $${idx++}`; params.push(filters.offset); }

    const result = await query(sql, params);
    return result.rows.map(r => new AuditLog(r));
  }

  // Get activity summary for analytics
  async getActivitySummary(organizationId, days = 30) {
    if (isLocalJSONDb) {
      const logs = await readTable('audit_logs');
      const filtered = logs.filter(l => l.organization_id === organizationId);

      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);

      const summaryMap = {};
      for (const log of filtered) {
        const createdDate = new Date(log.created_at);
        if (createdDate >= limitDate) {
          const dateStr = createdDate.toISOString().split('T')[0];
          const key = `${log.action}_${dateStr}`;
          if (!summaryMap[key]) {
            summaryMap[key] = {
              action: log.action,
              count: 0,
              date: dateStr
            };
          }
          summaryMap[key].count += 1;
        }
      }

      return Object.values(summaryMap).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const result = await query(
      `SELECT action, COUNT(*) as count, DATE(created_at) as date
       FROM audit_logs
       WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY action, DATE(created_at)
       ORDER BY date DESC, count DESC`,
      [organizationId]
    );
    return result.rows;
  }
}

export default new AuditRepository();

