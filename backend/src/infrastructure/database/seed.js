// ============================================================
// Database Seed Script — Populate demo data for Phase 10
// ============================================================
import { connectDB, query } from './connection.js';
import { logger } from '../logging/logger.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
  await connectDB();
  logger.info('🌱 Cleaning up existing user data and seeding SecureVault AI...');

  // 1. Clear existing user-related data
  try {
    logger.info('  🧹 Cleaning tables...');
    await query('DELETE FROM audit_logs');
    await query('DELETE FROM refresh_tokens');
    await query('DELETE FROM otp_verifications');
    await query('DELETE FROM document_versions');
    await query('DELETE FROM documents');
    await query('DELETE FROM users');
    logger.info('  ✅ Existing user data deleted successfully.');
  } catch (err) {
    logger.warn('  ⚠️ Note: error during table cleanup (some tables might not exist yet): ' + err.message);
  }

  // Create or verify demo organization
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

  // Create requested users
  const superAdminHash = await bcrypt.hash('SecureVault@Super2026', 12);
  const enterpriseAdminHash = await bcrypt.hash('SecureVault@Admin2026', 12);
  const employeeHash = await bcrypt.hash('SecureVault@Emp2026', 12);

  const users = [
    { employeeId: 'EMP000', name: 'Manya Parikh', email: 'manyaparikh23@gmail.com', role: 'SuperAdmin', department: null, designation: 'System Architect', hash: superAdminHash },
    { employeeId: 'EMP001', name: 'Parikh Gaming', email: 'parikhgaming@gmail.com', role: 'EnterpriseAdmin', department: null, designation: 'Director of Technology', hash: enterpriseAdminHash },
    { employeeId: 'EMP002', name: 'Amazing Employee', email: 'theamazingexperience57@gmail.com', role: 'Employee', department: 'Operations', designation: 'Operations Specialist', hash: employeeHash }
  ];

  const userIds = {};
  for (const u of users) {
    let uId = uuidv4();
    const res = await query(
      `INSERT INTO users (id, organization_id, employee_id, name, email, password_hash, role, department, designation, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE)
       RETURNING id`,
      [uId, orgId, u.employeeId, u.name, u.email, u.hash, u.role, u.department, u.designation]
    );
    if (res.rows && res.rows.length > 0) {
      uId = res.rows[0].id;
    }
    userIds[u.email] = uId;
  }
  logger.info('  ✅ Requested Super Admin, Enterprise Admin, and Employee users created successfully');

  // Create demo audit logs
  const adminUserId = userIds['parikhgaming@gmail.com'];
  const auditEntries = [
    { action: 'Login', details: 'Parikh Gaming logged in as Enterprise Admin', userName: 'Parikh Gaming', userRole: 'EnterpriseAdmin' },
    { action: 'Organization Registered', details: 'Acme Tech Solutions workspace initialized', userName: 'System', userRole: 'System' },
    { action: 'Employee Created', details: 'Added employee: Amazing Employee (Employee)', userName: 'Parikh Gaming', userRole: 'EnterpriseAdmin' },
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
  logger.info('  │ Super Admin:      manyaparikh23@gmail.com            │');
  logger.info('  │ Password:         SecureVault@Super2026              │');
  logger.info('  ├──────────────────────────────────────────────────────┤');
  logger.info('  │ Enterprise Admin: parikhgaming@gmail.com             │');
  logger.info('  │ Org Slug / ID:    acme-tech-solutions                │');
  logger.info('  │ Password:         SecureVault@Admin2026              │');
  logger.info('  ├──────────────────────────────────────────────────────┤');
  logger.info('  │ Employee:         theamazingexperience57@gmail.com   │');
  logger.info('  │ Employee ID:      EMP002                             │');
  logger.info('  │ Password:         SecureVault@Emp2026                │');
  logger.info('  └──────────────────────────────────────────────────────┘');

  process.exit(0);
};

seed().catch(err => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
