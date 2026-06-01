// ============================================================
// API Controller: Authentication
// POST /api/v1/auth/send-otp
// POST /api/v1/auth/login
// POST /api/v1/auth/register-organization
// POST /api/v1/auth/register-employee
// POST /api/v1/auth/forgot-password
// POST /api/v1/auth/reset-password
// POST /api/v1/auth/logout
// GET  /api/v1/auth/me
// ============================================================
import authService from '../../application/services/AuthService.js';
import { createError } from '../middleware/errorHandler.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { query } from '../../infrastructure/database/connection.js';
import auditRepository from '../../infrastructure/repositories/AuditRepository.js';

// POST /send-otp — Generate and store OTP for email verification
export const sendOTP = async (req, res) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    throw createError('Email and purpose are required.', 400);
  }

  const validPurposes = ['login', 'register', 'reset_password', 'invite'];
  if (!validPurposes.includes(purpose)) {
    throw createError(`Invalid purpose. Must be one of: ${validPurposes.join(', ')}`, 400);
  }

  const otp = await authService.storeOTP(email, purpose, req.ip);

  res.json({
    success: true,
    message: 'OTP generated. In production this would be sent via email/SMS.',
    // Dev only — remove in production
    ...(process.env.NODE_ENV === 'development' && { devOTP: otp }),
    expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 10} minutes`
  });
};

// POST /login — Verify OTP and issue JWT
export const login = async (req, res) => {
  const { email, password, otp, role, organizationId, employeeId } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required.', 400);
  }

  // Verify OTP if provided
  if (otp) {
    const otpResult = await authService.verifyOTP(email, otp, 'login');
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.reason });
    }
  }

  const result = await authService.login(email, password, role, organizationId, employeeId, req.ip);

  if (!result.success) {
    return res.status(401).json({ success: false, message: result.message });
  }

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Log audit event
  await auditRepository.log({
    organizationId: result.user.organization_id,
    userId: result.user.id,
    userName: result.user.name,
    userRole: result.user.role,
    action: 'Login',
    resourceType: 'Session',
    details: `Successful login via ${otp ? 'OTP + Password' : 'Password'}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.json({
    success: true,
    accessToken: result.accessToken,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      organizationId: result.user.organization_id,
      department: result.user.department,
      designation: result.user.designation,
      employeeId: result.user.employee_id,
      profilePhoto: result.user.profile_photo
    }
  });
};

// POST /register-organization
export const registerOrganization = async (req, res) => {
  const { otp, ...registrationData } = req.body;

  // Verify registration OTP
  if (otp) {
    const otpResult = await authService.verifyOTP(registrationData.adminEmail || registrationData.companyEmail, otp, 'register');
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.reason });
    }
  }

  const result = await authService.registerOrganization(
    {
      companyName: registrationData.companyName,
      companyType: registrationData.companyType,
      industry: registrationData.industry,
      gstNumber: registrationData.gstNumber,
      companyEmail: registrationData.companyEmail,
      contactNumber: registrationData.contactNumber,
      address: registrationData.address,
      city: registrationData.city,
      state: registrationData.state,
      country: registrationData.country,
      numberOfEmployees: registrationData.numberOfEmployees
    },
    {
      adminName: registrationData.adminName,
      adminEmail: registrationData.adminEmail,
      email: registrationData.adminEmail,
      password: registrationData.password
    }
  );

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  res.status(201).json({
    success: true,
    message: 'Organization registered successfully. Admin account created.',
    accessToken: result.accessToken,
    organization: { id: result.organization.id, name: result.organization.name, slug: result.organization.slug },
    user: result.user
  });
};

// POST /register-employee
export const registerEmployee = async (req, res) => {
  const { firstName, lastName, email, password, employeeId, department, designation, mobileNumber, organizationId, otp } = req.body;

  // Verify OTP
  if (otp) {
    const otpResult = await authService.verifyOTP(email, otp, 'register');
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.reason });
    }
  }

  const passwordHash = await authService.hashPassword(password);
  const { UserRepository } = await import('../../infrastructure/repositories/UserRepository.js');
  const userRepo = new UserRepository();

  const user = await userRepo.create({
    organizationId,
    employeeId,
    name: `${firstName} ${lastName}`.trim(),
    email,
    passwordHash,
    role: 'Employee',
    department,
    designation,
    mobileNumber,
    isVerified: false // Requires admin activation
  });

  res.status(201).json({
    success: true,
    message: 'Self-registration submitted. Awaiting administrator approval.',
    userId: user.id
  });
};

// POST /forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) throw createError('Email is required.', 400);

  const otp = await authService.storeOTP(email, 'reset_password', req.ip);

  res.json({
    success: true,
    message: 'Password reset OTP generated.',
    ...(process.env.NODE_ENV === 'development' && { devOTP: otp })
  });
};

// POST /reset-password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) throw createError('Email, OTP, and new password are required.', 400);

  if (newPassword.length < 8) throw createError('Password must be at least 8 characters.', 400);

  const otpResult = await authService.verifyOTP(email, otp, 'reset_password');
  if (!otpResult.valid) return res.status(400).json({ success: false, message: otpResult.reason });

  const result = await authService.resetPassword(email, newPassword);
  if (!result.success) return res.status(400).json({ success: false, message: result.message });

  res.json({ success: true, message: 'Password reset successfully. All sessions invalidated.' });
};

// POST /logout
export const logout = async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};
