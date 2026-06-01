// ============================================================
// Routes: Employees / Team Management
// ============================================================
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import userRepository, { UserRepository } from '../../infrastructure/repositories/UserRepository.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';
import authService from '../../application/services/AuthService.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

// GET / — List all employees in organization
router.get('/', authorize('SuperAdmin', 'EnterpriseAdmin', 'DepartmentManager'), async (req, res) => {
  const { department, role } = req.query;
  const filters = {};

  if (department) filters.department = department;
  if (role) filters.role = role;

  // Managers can only see their department
  if (req.user.role === 'DepartmentManager') {
    filters.department = req.user.department;
  }

  const employees = await userRepository.findByOrganization(req.organizationId, filters);
  res.json({ success: true, employees: employees.map(e => e.toPublicJSON()) });
});

// GET /me/profile — Get own profile
router.get('/me/profile', async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  res.json({ success: true, user: user.toPublicJSON() });
});

// PUT /me/profile — Update own profile
router.put('/me/profile', async (req, res) => {
  const { name, mobileNumber, skills, designation } = req.body;
  const updated = await userRepository.update(req.user.id, { name, mobileNumber, skills, designation });

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Profile Updated',
    resourceType: 'User',
    resourceId: req.user.id,
    resourceName: req.user.name,
    details: 'User updated their profile information',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Profile updated.', user: updated.toPublicJSON() });
});

// POST /invite — Admin invites new employee
router.post('/invite', authorize('SuperAdmin', 'EnterpriseAdmin'), async (req, res) => {
  const { name, email, role, department, designation, employeeId, temporaryPassword } = req.body;

  if (!name || !email || !role) throw createError('Name, email, and role are required.', 400);

  const passwordHash = await authService.hashPassword(temporaryPassword || `SecureVault@${Math.floor(Math.random() * 9000 + 1000)}`);

  const userRepo = new UserRepository();
  const user = await userRepo.create({
    organizationId: req.organizationId,
    employeeId,
    name,
    email,
    passwordHash,
    role,
    department,
    designation,
    isVerified: true
  });

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Employee Created',
    resourceType: 'User',
    resourceId: user.id,
    resourceName: user.name,
    details: `Added employee: ${name} (${role})${department ? ` in ${department}` : ''}`,
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    message: `Employee ${name} created successfully.`,
    user: user.toPublicJSON()
  });
});

// PATCH /:id — Update employee (admin only)
router.patch('/:id', authorize('SuperAdmin', 'EnterpriseAdmin', 'DepartmentManager'), async (req, res) => {
  const { name, department, designation, role, isActive } = req.body;

  const userRepo = new UserRepository();
  const updated = await userRepo.update(req.params.id, { name, department, designation, role, isActive });
  if (!updated) throw createError('Employee not found.', 404);

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Employee Updated',
    resourceType: 'User',
    resourceId: req.params.id,
    details: `Modified employee: ${updated.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, user: updated.toPublicJSON() });
});

// DELETE /:id — Deactivate employee access
router.delete('/:id', authorize('SuperAdmin', 'EnterpriseAdmin'), async (req, res) => {
  const userRepo = new UserRepository();
  const deactivated = await userRepo.deactivate(req.params.id);
  if (!deactivated) throw createError('Employee not found.', 404);

  await auditRepository.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'Employee Access Revoked',
    resourceType: 'User',
    resourceId: req.params.id,
    resourceName: deactivated.name,
    details: `Deactivated account for: ${deactivated.name}`,
    ipAddress: req.ip
  });

  res.json({ success: true, message: `Access revoked for ${deactivated.name}.` });
});

// POST /me/change-password
router.post('/me/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw createError('Current and new password required.', 400);
  if (newPassword.length < 8) throw createError('New password must be at least 8 characters.', 400);

  const rawUser = await userRepository.findByEmail(req.user.email);
  const valid = await authService.verifyPassword(currentPassword, rawUser.password_hash);
  if (!valid) throw createError('Current password is incorrect.', 400);

  const passwordHash = await authService.hashPassword(newPassword);
  await userRepository.update(req.user.id, { passwordHash });

  res.json({ success: true, message: 'Password changed successfully.' });
});

export default router;
