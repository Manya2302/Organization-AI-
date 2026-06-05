import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class TwinSynchronizationEngine {
  /**
   * Run incremental synchronization on all registry entities.
   * Compares the current source tables against digital_twin_entities to perform change detection.
   */
  async incrementalSync(organizationId) {
    const startTime = Date.now();
    logger.info(`[TwinSyncEngine] Starting incremental synchronization for org: ${organizationId}`);

    try {
      // 1. Fetch current active registry source datasets
      const employees = await query(`SELECT id, name, department, designation FROM users WHERE organization_id = $1`, [organizationId]);
      const projects = await query(`SELECT id, project_name, status FROM project_registry WHERE organization_id = $1`, [organizationId]);
      const vendors = await query(`SELECT id, vendor_name, service_provided, status FROM vendor_registry WHERE organization_id = $1`, [organizationId]);
      const risks = await query(`SELECT id, risk_title, category, severity, score FROM risk_register WHERE organization_id = $1`, [organizationId]);
      const workflows = await query(`SELECT id, title, workflow_type, status FROM enterprise_workflows WHERE organization_id = $1`, [organizationId]);

      // 2. Fetch already twin-synced entities
      const twinEntitiesRes = await query(
        `SELECT id, entity_name, entity_type, properties FROM digital_twin_entities WHERE organization_id = $1`,
        [organizationId]
      );
      const twinEntities = twinEntitiesRes.rows;

      const toInsert = [];
      const toUpdate = [];
      const toDeleteIds = [];

      // Map synced twin entities by their source_id property
      const twinMapBySourceId = new Map();
      twinEntities.forEach(ent => {
        const srcId = ent.properties?.source_id;
        if (srcId) {
          twinMapBySourceId.set(`${ent.entity_type}:${srcId}`, ent);
        }
      });

      // Keep track of active source mappings to identify deletions
      const activeSourceKeys = new Set();

      // Process Employees
      employees.rows.forEach(emp => {
        const key = `Employee:${emp.id}`;
        activeSourceKeys.add(key);
        const match = twinMapBySourceId.get(key);
        const props = { source_id: emp.id, designation: emp.designation, department: emp.department };

        if (!match) {
          toInsert.push({ name: emp.name, type: 'Employee', properties: props });
        } else if (JSON.stringify(match.properties) !== JSON.stringify(props) || match.entity_name !== emp.name) {
          toUpdate.push({ id: match.id, name: emp.name, properties: props });
        }
      });

      // Process Projects
      projects.rows.forEach(p => {
        const key = `Project:${p.id}`;
        activeSourceKeys.add(key);
        const match = twinMapBySourceId.get(key);
        const props = { source_id: p.id, status: p.status };

        if (!match) {
          toInsert.push({ name: p.project_name, type: 'Project', properties: props });
        } else if (JSON.stringify(match.properties) !== JSON.stringify(props) || match.entity_name !== p.project_name) {
          toUpdate.push({ id: match.id, name: p.project_name, properties: props });
        }
      });

      // Process Vendors
      vendors.rows.forEach(v => {
        const key = `Vendor:${v.id}`;
        activeSourceKeys.add(key);
        const match = twinMapBySourceId.get(key);
        const props = { source_id: v.id, service_provided: v.service_provided, status: v.status };

        if (!match) {
          toInsert.push({ name: v.vendor_name, type: 'Vendor', properties: props });
        } else if (JSON.stringify(match.properties) !== JSON.stringify(props) || match.entity_name !== v.vendor_name) {
          toUpdate.push({ id: match.id, name: v.vendor_name, properties: props });
        }
      });

      // Process Risks
      risks.rows.forEach(r => {
        const key = `Risk:${r.id}`;
        activeSourceKeys.add(key);
        const match = twinMapBySourceId.get(key);
        const props = { source_id: r.id, category: r.category, severity: r.severity, score: r.score };

        if (!match) {
          toInsert.push({ name: r.risk_title, type: 'Risk', properties: props });
        } else if (JSON.stringify(match.properties) !== JSON.stringify(props) || match.entity_name !== r.risk_title) {
          toUpdate.push({ id: match.id, name: r.risk_title, properties: props });
        }
      });

      // Process Workflows
      workflows.rows.forEach(wf => {
        const key = `Workflow:${wf.id}`;
        activeSourceKeys.add(key);
        const match = twinMapBySourceId.get(key);
        const props = { source_id: wf.id, workflow_type: wf.workflow_type, status: wf.status };

        if (!match) {
          toInsert.push({ name: wf.title, type: 'Workflow', properties: props });
        } else if (JSON.stringify(match.properties) !== JSON.stringify(props) || match.entity_name !== wf.title) {
          toUpdate.push({ id: match.id, name: wf.title, properties: props });
        }
      });

      // Find deleted entities
      twinEntities.forEach(ent => {
        const srcId = ent.properties?.source_id;
        // Skip department entities which are created dynamically
        if (ent.entity_type === 'Department') return;

        if (srcId) {
          const key = `${ent.entity_type}:${srcId}`;
          if (!activeSourceKeys.has(key)) {
            toDeleteIds.push(ent.id);
          }
        }
      });

      // 3. Apply changes (Increments)
      let insertedCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      for (const item of toInsert) {
        await query(
          `INSERT INTO digital_twin_entities (organization_id, entity_name, entity_type, properties, status)
           VALUES ($1, $2, $3, $4, 'Synced')`,
          [organizationId, item.name, item.type, JSON.stringify(item.properties)]
        );
        insertedCount++;
      }

      for (const item of toUpdate) {
        await query(
          `UPDATE digital_twin_entities 
           SET entity_name = $1, properties = $2, status = 'Synced', last_sync_at = NOW(), updated_at = NOW()
           WHERE id = $3`,
          [item.name, JSON.stringify(item.properties), item.id]
        );
        updatedCount++;
      }

      if (toDeleteIds.length > 0) {
        // Cascade delete will clean up relationships
        await query(
          `DELETE FROM digital_twin_entities WHERE id = ANY($1::uuid[])`,
          [toDeleteIds]
        );
        deletedCount = toDeleteIds.length;
      }

      const duration = Date.now() - startTime;
      const totalEntities = twinEntities.length + insertedCount - deletedCount;

      // 4. Calculate Twin Health Indices
      // Health is affected by out-of-sync nodes, orphaned relationships, or missing metrics
      const orphanedRelsRes = await query(
        `SELECT COUNT(*) FROM digital_twin_relationships r
         LEFT JOIN digital_twin_entities s ON r.source_entity_id = s.id
         LEFT JOIN digital_twin_entities t ON r.target_entity_id = t.id
         WHERE r.organization_id = $1 AND (s.id IS NULL OR t.id IS NULL)`,
        [organizationId]
      );
      const orphanedCount = parseInt(orphanedRelsRes.rows[0].count, 10);
      
      const healthScore = Math.max(0, 100 - (orphanedCount * 5) - (deletedCount * 2));

      await query(
        `INSERT INTO digital_twin_sync (organization_id, sync_status, entities_count, relationships_count, sync_duration_ms, details)
         VALUES ($1, 'Completed', $2, $3, $4, $5)`,
        [
          organizationId,
          totalEntities,
          twinEntities.length, // approximation
          duration,
          `Incremental update complete. Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}. Twin Health: ${healthScore}%.`
        ]
      );

      return {
        success: true,
        insertedCount,
        updatedCount,
        deletedCount,
        healthScore,
        totalEntities,
        syncDurationMs: duration
      };
    } catch (err) {
      logger.error('[TwinSyncEngine] Error in incrementalSync:', err);
      return { success: false, error: err.message };
    }
  }
}

export const twinSyncEngine = new TwinSynchronizationEngine();
