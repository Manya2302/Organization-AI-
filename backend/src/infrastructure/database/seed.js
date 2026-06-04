// ============================================================
// Database Seed Script — Populate demo data for Phase 1
// ============================================================
import { connectDB, query } from './connection.js';
import { logger } from '../logging/logger.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
  await connectDB();
  logger.info('🌱 Seeding SecureVault AI demo data...');

  // Create demo organization
  let orgId = uuidv4();
  try {
    const res = await query(
      `INSERT INTO organizations (id, name, slug, company_type, industry, company_email, contact_number, city, state, country, number_of_employees)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [orgId, 'Acme Tech Solutions Pvt. Ltd.', 'acme-tech-solutions', 'Private Limited', 'Technology',
       'admin@acmetech.com', '+91 98765 43210', 'Bangalore', 'Karnataka', 'India', '50-100']
    );
    if (res.rows && res.rows.length > 0) {
      orgId = res.rows[0].id;
    }
  } catch (err) {
    const res = await query('SELECT id FROM organizations WHERE slug = $1', ['acme-tech-solutions']);
    if (res.rows && res.rows.length > 0) {
      orgId = res.rows[0].id;
    }
  }
  logger.info(`  ✅ Organization verified: Acme Tech Solutions (${orgId})`);

  // Create demo users
  const defaultHash = await bcrypt.hash('SecureVault@2025', 12);
  const superAdminHash = await bcrypt.hash('admin@123', 12);

  const users = [
    { employeeId: 'EMP000', name: 'Manya Parikh', email: 'manyaparikh23@gmail.com', role: 'SuperAdmin', department: null, designation: 'System Architect', hash: superAdminHash },
    { employeeId: 'EMP001', name: 'Alok Sharma', email: 'alok@acmetech.com', role: 'EnterpriseAdmin', department: null, designation: 'Director of Technology', hash: defaultHash },
    { employeeId: 'EMP002', name: 'Priya Patel', email: 'priya@acmetech.com', role: 'DepartmentManager', department: 'Legal', designation: 'Lead Legal Counsel', hash: defaultHash },
    { employeeId: 'EMP003', name: 'Rohan Verma', email: 'rohan@acmetech.com', role: 'Employee', department: 'Finance', designation: 'Senior Accountant', hash: defaultHash },
    { employeeId: 'EMP004', name: 'Neha Gupta', email: 'neha@acmetech.com', role: 'Employee', department: 'HR', designation: 'Talent Acquisition', hash: defaultHash },
  ];

  const userIds = {};
  for (const u of users) {
    let uId = uuidv4();
    try {
      const res = await query(
        `INSERT INTO users (id, organization_id, employee_id, name, email, password_hash, role, department, designation, is_active, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE)
         RETURNING id`,
        [uId, orgId, u.employeeId, u.name, u.email, u.hash, u.role, u.department, u.designation]
      );
      if (res.rows && res.rows.length > 0) {
        uId = res.rows[0].id;
      }
    } catch (err) {
      // If user already exists by employee_id or email, update their details to keep seed sync
      const res = await query('SELECT id FROM users WHERE email = $1 OR (organization_id = $2 AND employee_id = $3)', [u.email, orgId, u.employeeId]);
      if (res.rows && res.rows.length > 0) {
        uId = res.rows[0].id;
        await query('UPDATE users SET password_hash = $1, email = $2, name = $3, role = $4, department = $5, designation = $6 WHERE id = $7', 
          [u.hash, u.email, u.name, u.role, u.department, u.designation, uId]);
      }
    }
    userIds[u.email] = uId;
  }
  logger.info('  ✅ Demo and Super Admin users verified');

  // Create demo audit logs
  const adminUserId = userIds['alok@acmetech.com'];
  const auditEntries = [
    { action: 'Login', details: 'Alok Sharma logged in as Enterprise Admin', userName: 'Alok Sharma', userRole: 'EnterpriseAdmin' },
    { action: 'Organization Registered', details: 'Acme Tech Solutions workspace initialized', userName: 'System', userRole: 'System' },
    { action: 'Employee Created', details: 'Added employee: Priya Patel (DepartmentManager)', userName: 'Alok Sharma', userRole: 'EnterpriseAdmin' },
    { action: 'Employee Created', details: 'Added employee: Rohan Verma (Employee)', userName: 'Alok Sharma', userRole: 'EnterpriseAdmin' },
  ];

  for (const log of auditEntries) {
    await query(
      `INSERT INTO audit_logs (organization_id, user_id, user_name, user_role, action, details, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, '192.168.1.100', 'success')`,
      [orgId, adminUserId, log.userName, log.userRole, log.action, log.details]
    );
  }
  logger.info('  ✅ Demo audit logs created');

  logger.info('');
  logger.info('🎉 Seeding complete!');
  logger.info('');
  logger.info('  📧 Login credentials:');
  logger.info('  ┌──────────────────────────────────────────────────────┐');
  logger.info('  │ Enterprise Admin: alok@acmetech.com                  │');
  logger.info('  │ Manager:          priya@acmetech.com                 │');
  logger.info('  │ Employee:         rohan@acmetech.com                 │');
  logger.info('  │ Password:         SecureVault@2025                   │');
  logger.info('  └──────────────────────────────────────────────────────┘');

  process.exit(0);
};

seed().catch(err => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
