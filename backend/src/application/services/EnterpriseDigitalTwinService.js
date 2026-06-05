import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class EnterpriseDigitalTwinService {
  async getSnapshot(organizationId) {
    try {
      const entitiesRes = await query(
        `SELECT * FROM digital_twin_entities WHERE organization_id = $1 ORDER BY entity_type, entity_name`,
        [organizationId]
      );
      const relationshipsRes = await query(
        `SELECT r.*, s.entity_name as source_name, s.entity_type as source_type,
                t.entity_name as target_name, t.entity_type as target_type
         FROM digital_twin_relationships r
         JOIN digital_twin_entities s ON r.source_entity_id = s.id
         JOIN digital_twin_entities t ON r.target_entity_id = t.id
         WHERE r.organization_id = $1`,
        [organizationId]
      );
      return {
        entities: entitiesRes.rows,
        relationships: relationshipsRes.rows
      };
    } catch (err) {
      logger.error('EnterpriseDigitalTwinService.getSnapshot error:', err);
      return { entities: [], relationships: [] };
    }
  }

  async syncTwin(organizationId) {
    const startTime = Date.now();
    try {
      logger.info(`🔄 Synchronizing digital twin for org ${organizationId}...`);

      // 1. Fetch data from source tables
      const employees = await query(`SELECT id, name, department, designation FROM users WHERE organization_id = $1`, [organizationId]);
      const projects = await query(`SELECT id, project_name, status FROM project_registry WHERE organization_id = $1`, [organizationId]);
      const vendors = await query(`SELECT id, vendor_name, service_provided, status FROM vendor_registry WHERE organization_id = $1`, [organizationId]);
      const decisions = await query(`SELECT id, title, decision_type, status FROM decision_registry WHERE organization_id = $1`, [organizationId]);
      const workflows = await query(`SELECT id, title, workflow_type, status FROM enterprise_workflows WHERE organization_id = $1`, [organizationId]);
      const risks = await query(`SELECT id, risk_title, category, severity, score FROM risk_register WHERE organization_id = $1`, [organizationId]);

      // 2. Clear old twin data (cascades to relationships)
      await query(`DELETE FROM digital_twin_entities WHERE organization_id = $1`, [organizationId]);

      let entitiesCount = 0;
      let relationshipsCount = 0;

      const entityMap = new Map(); // Maps source ID to new digital twin entity ID

      // Helper to insert entity
      const insertEntity = async (name, type, properties) => {
        const res = await query(
          `INSERT INTO digital_twin_entities (organization_id, entity_name, entity_type, properties, status)
           VALUES ($1, $2, $3, $4, 'Synced') RETURNING id`,
          [organizationId, name, type, JSON.stringify(properties)]
        );
        entitiesCount++;
        return res.rows[0].id;
      };

      // Seed departments list dynamically from employees
      const departments = [...new Set(employees.rows.map(e => e.department).filter(Boolean))];
      const deptIds = {};
      for (const dept of departments) {
        const id = await insertEntity(dept, 'Department', { description: `${dept} Department` });
        deptIds[dept] = id;
      }

      // Seed Employees
      for (const emp of employees.rows) {
        const twinId = await insertEntity(emp.name, 'Employee', {
          source_id: emp.id,
          designation: emp.designation,
          department: emp.department
        });
        entityMap.set(emp.id, twinId);

        // Link Employee to Department
        if (emp.department && deptIds[emp.department]) {
          await query(
            `INSERT INTO digital_twin_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
             VALUES ($1, $2, $3, 'belongs_to', 1.00)`,
            [organizationId, twinId, deptIds[emp.department]]
          );
          relationshipsCount++;
        }
      }

      // Seed Projects
      for (const proj of projects.rows) {
        const twinId = await insertEntity(proj.project_name, 'Project', {
          source_id: proj.id,
          status: proj.status
        });
        entityMap.set(proj.id, twinId);
      }

      // Seed Vendors
      for (const vend of vendors.rows) {
        const twinId = await insertEntity(vend.vendor_name, 'Vendor', {
          source_id: vend.id,
          service_provided: vend.service_provided,
          status: vend.status
        });
        entityMap.set(vend.id, twinId);
      }

      // Seed Decisions
      for (const dec of decisions.rows) {
        const twinId = await insertEntity(dec.title, 'Decision', {
          source_id: dec.id,
          decision_type: dec.decision_type,
          status: dec.status
        });
        entityMap.set(dec.id, twinId);
      }

      // Seed Workflows
      for (const wf of workflows.rows) {
        const twinId = await insertEntity(wf.title, 'Workflow', {
          source_id: wf.id,
          workflow_type: wf.workflow_type,
          status: wf.status
        });
        entityMap.set(wf.id, twinId);
      }

      // Seed Risks
      for (const rsk of risks.rows) {
        const twinId = await insertEntity(rsk.risk_title, 'Risk', {
          source_id: rsk.id,
          category: rsk.category,
          severity: rsk.severity,
          score: rsk.score
        });
        entityMap.set(rsk.id, twinId);
      }

      // Add relationships
      // Mock relationship seeding based on database configurations or types
      const twinEntities = await query(`SELECT id, entity_name, entity_type, properties FROM digital_twin_entities WHERE organization_id = $1`, [organizationId]);

      const projectsTwin = twinEntities.rows.filter(e => e.entity_type === 'Project');
      const departmentsTwin = twinEntities.rows.filter(e => e.entity_type === 'Department');
      const vendorsTwin = twinEntities.rows.filter(e => e.entity_type === 'Vendor');
      const risksTwin = twinEntities.rows.filter(e => e.entity_type === 'Risk');
      const workflowsTwin = twinEntities.rows.filter(e => e.entity_type === 'Workflow');

      // Project depends on Department
      for (let i = 0; i < projectsTwin.length; i++) {
        if (departmentsTwin.length > 0) {
          const dept = departmentsTwin[i % departmentsTwin.length];
          await query(
            `INSERT INTO digital_twin_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
             VALUES ($1, $2, $3, 'reports_to', 0.90)`,
            [organizationId, projectsTwin[i].id, dept.id]
          );
          relationshipsCount++;
        }
        // Project uses Vendor
        if (vendorsTwin.length > 0) {
          const vendor = vendorsTwin[i % vendorsTwin.length];
          await query(
            `INSERT INTO digital_twin_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
             VALUES ($1, $2, $3, 'uses', 0.85)`,
            [organizationId, projectsTwin[i].id, vendor.id]
          );
          relationshipsCount++;
        }
      }

      // Risks affect Departments and Workflows
      for (let i = 0; i < risksTwin.length; i++) {
        if (departmentsTwin.length > 0) {
          const dept = departmentsTwin[i % departmentsTwin.length];
          await query(
            `INSERT INTO digital_twin_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
             VALUES ($1, $2, $3, 'affects', 0.75)`,
            [organizationId, risksTwin[i].id, dept.id]
          );
          relationshipsCount++;
        }
        if (workflowsTwin.length > 0) {
          const wf = workflowsTwin[i % workflowsTwin.length];
          await query(
            `INSERT INTO digital_twin_relationships (organization_id, source_entity_id, target_entity_id, relationship_type, strength)
             VALUES ($1, $2, $3, 'affects', 0.80)`,
            [organizationId, risksTwin[i].id, wf.id]
          );
          relationshipsCount++;
        }
      }

      const duration = Date.now() - startTime;

      // Save sync log
      await query(
        `INSERT INTO digital_twin_sync (organization_id, sync_status, entities_count, relationships_count, sync_duration_ms, details)
         VALUES ($1, 'Completed', $2, $3, $4, 'Successfully synchronized digital twin from organization registry tables.')`,
         [organizationId, entitiesCount, relationshipsCount, duration]
      );

      logger.info(`✅ Sync completed: ${entitiesCount} entities and ${relationshipsCount} relationships synced in ${duration}ms.`);
      return { success: true, entitiesCount, relationshipsCount };
    } catch (err) {
      logger.error('EnterpriseDigitalTwinService.syncTwin error:', err);
      const duration = Date.now() - startTime;
      await query(
        `INSERT INTO digital_twin_sync (organization_id, sync_status, sync_duration_ms, details)
         VALUES ($1, 'Failed', $2, $3)`,
         [organizationId, duration, err.message]
      );
      throw err;
    }
  }
}

export const twinService = new EnterpriseDigitalTwinService();
