import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { readTable, writeTable, insertRow } from '../../infrastructure/database/jsonDb.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class HumanValidationService {
  static async validateFeedback({
    organizationId,
    userId,
    userName,
    userRole,
    targetType, // 'classification', 'relationship', 'entity', 'summary'
    targetId,
    fieldName = null,
    feedback, // 'approved', 'rejected'
    reason = ''
  }) {
    try {
      let validationLog;

      if (isLocalJSONDb) {
        // 1. Insert validation log entry into JSON
        validationLog = await insertRow('validation_logs', {
          organization_id: organizationId,
          target_type: targetType,
          target_id: targetId,
          field_name: fieldName,
          validation_feedback: feedback,
          validation_reason: reason,
          approved_by: userId,
          approved_at: new Date().toISOString()
        });

        // 2. Perform target side-effects in JSON
        if (targetType === 'relationship') {
          const status = feedback === 'approved' ? 'approved' : 'rejected';
          const rels = await readTable('document_relationships');
          const idx = rels.findIndex(r => r.id === targetId && r.organization_id === organizationId);
          if (idx !== -1) {
            rels[idx].validation_status = status;
            rels[idx].human_verified = true;
            rels[idx].updated_at = new Date().toISOString();
            await writeTable('document_relationships', rels);
          }
        } else if (targetType === 'classification') {
          const docs = await readTable('documents');
          const idx = docs.findIndex(d => d.id === targetId && d.organization_id === organizationId);
          if (idx !== -1) {
            if (!docs[idx].metadata) docs[idx].metadata = {};
            if (feedback === 'approved') {
              docs[idx].metadata.classification_verified = true;
            } else {
              docs[idx].category = 'General';
              docs[idx].metadata.classification_verified = false;
            }
            docs[idx].updated_at = new Date().toISOString();
            await writeTable('documents', docs);
          }
        }

        // 3. Write audit log in JSON
        await insertRow('audit_logs', {
          organization_id: organizationId,
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          action: 'Human Validation',
          resource_type: targetType,
          resource_id: targetId,
          details: `User ${userName} validated AI ${targetType} as ${feedback.toUpperCase()}. Reason: ${reason || 'None'}`
        });

      } else {
        // 1. Insert validation log entry in Postgres
        const logRes = await query(
          `INSERT INTO validation_logs 
           (organization_id, target_type, target_id, field_name, validation_feedback, validation_reason, approved_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [organizationId, targetType, targetId, fieldName, feedback, reason, userId]
        );
        validationLog = logRes.rows[0];

        // 2. Perform target side-effects in Postgres
        if (targetType === 'relationship') {
          const status = feedback === 'approved' ? 'approved' : 'rejected';
          await query(
            `UPDATE document_relationships 
             SET validation_status = $1, human_verified = TRUE 
             WHERE id = $2 AND organization_id = $3`,
            [status, targetId, organizationId]
          );
        } else if (targetType === 'classification') {
          if (feedback === 'approved') {
            await query(
              `UPDATE documents 
               SET metadata = jsonb_set(metadata, '{classification_verified}', 'true')
               WHERE id = $1 AND organization_id = $2`,
              [targetId, organizationId]
            );
          } else {
            await query(
              `UPDATE documents 
               SET category = 'General', metadata = jsonb_set(metadata, '{classification_verified}', 'false')
               WHERE id = $1 AND organization_id = $2`,
              [targetId, organizationId]
            );
          }
        }

        // 3. Write audit log in Postgres
        await query(
          `INSERT INTO audit_logs (organization_id, user_id, user_name, user_role, action, resource_type, resource_id, details)
           VALUES ($1, $2, $3, $4, 'Human Validation', $5, $6, $7)`,
          [
            organizationId,
            userId,
            userName,
            userRole,
            targetType,
            targetId,
            `User ${userName} validated AI ${targetType} as ${feedback.toUpperCase()}. Reason: ${reason || 'None'}`
          ]
        );
      }

      return validationLog;
    } catch (err) {
      logger.error('Error recording human validation:', err);
      throw err;
    }
  }

  static async getValidationLogs(organizationId) {
    if (isLocalJSONDb) {
      const logs = await readTable('validation_logs');
      const users = await readTable('users');
      const filteredLogs = logs
        .filter(l => l.organization_id === organizationId)
        .map(log => {
          const u = users.find(user => user.id === log.approved_by);
          return {
            ...log,
            user_name: u ? u.name : 'Unknown User'
          };
        });
      filteredLogs.sort((a, b) => new Date(b.approved_at || b.created_at) - new Date(a.approved_at || a.created_at));
      return filteredLogs.slice(0, 50);
    }

    const res = await query(
      `SELECT vl.*, u.name as user_name FROM validation_logs vl
       LEFT JOIN users u ON vl.approved_by = u.id
       WHERE vl.organization_id = $1 
       ORDER BY vl.approved_at DESC LIMIT 50`,
      [organizationId]
    );
    return res.rows;
  }
}
