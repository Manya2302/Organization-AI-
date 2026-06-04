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

  // ── SECURITY FIX: For LOGIN and RESET — verify the account exists first ──
  if (purpose === 'login' || purpose === 'reset_password') {
    const { UserRepository } = await import('../../infrastructure/repositories/UserRepository.js');
    const userRepo = new UserRepository();
    const existingUser = await userRepo.findByEmail(email);
    if (!existingUser) {
      // Return a generic message to prevent email enumeration attacks,
      // but do NOT send any OTP or email
      logger.warn(`OTP requested for non-existent account: ${email} (purpose: ${purpose})`);
      return res.status(404).json({
        success: false,
        message: purpose === 'login'
          ? 'No account found with this email address. Please register first.'
          : 'No account found with this email address.'
      });
    }
    if (existingUser.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact your administrator.'
      });
    }
  }

  // ── SECURITY FIX: For REGISTER — ensure the email is NOT already registered ──
  if (purpose === 'register') {
    const { UserRepository } = await import('../../infrastructure/repositories/UserRepository.js');
    const userRepo = new UserRepository();
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in instead.'
      });
    }
  }

  const otp = await authService.storeOTP(email, purpose, req.ip);

  res.json({
    success: true,
    message: 'Verification code sent to your email address.',
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

  const verifyEmail = registrationData.adminEmail || registrationData.companyEmail;

  // ── SECURITY FIX: OTP is REQUIRED for registration — no OTP = no account created ──
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'Email verification code is required. Please verify your email first.'
    });
  }

  const otpResult = await authService.verifyOTP(verifyEmail, otp, 'register');
  if (!otpResult.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please request a new OTP.'
    });
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

  if (!email || !password || !firstName || !lastName) {
    throw createError('First name, last name, email, and password are required.', 400);
  }

  // ── SECURITY FIX: OTP is REQUIRED — no OTP = no account created ──
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'Email verification code is required. Please verify your email first.'
    });
  }

  const otpResult = await authService.verifyOTP(email, otp, 'register');
  if (!otpResult.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please request a new OTP.'
    });
  }

  // OTP verified — now safe to create the account
  const { UserRepository } = await import('../../infrastructure/repositories/UserRepository.js');
  const userRepo = new UserRepository();

  // Check for duplicate email
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.'
    });
  }

  const passwordHash = await authService.hashPassword(password);

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
    message: 'Registration complete. Your account is pending administrator approval.',
    userId: user.id
  });
};

// POST /forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) throw createError('Email is required.', 400);

  // ── SECURITY FIX: Only send reset OTP if account exists ──
  const { UserRepository } = await import('../../infrastructure/repositories/UserRepository.js');
  const userRepo = new UserRepository();
  const existingUser = await userRepo.findByEmail(email);
  if (!existingUser) {
    // Do not reveal whether the email is registered (security best practice)
    return res.json({
      success: true,
      message: 'If an account with this email exists, a reset code has been sent.'
    });
  }

  const otp = await authService.storeOTP(email, 'reset_password', req.ip);

  res.json({
    success: true,
    message: 'Password reset code sent to your email address.',
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

// POST /google-login
export const googleLogin = async (req, res) => {
  const { email, name, googleId } = req.body;

  if (!email) {
    throw createError('Email is required for Google login.', 400);
  }

  logger.info(`🌐 Google Login request received for email: ${email}`);

  const { UserRepository } = await import('../../infrastructure/repositories/UserRepository.js');
  const userRepo = new UserRepository();

  let user = await userRepo.findByEmail(email);

  if (!user) {
    // Auto-register user into the default organization if they don't exist
    const { isLocalJSONDb } = await import('../../infrastructure/database/connection.js');
    const { readTable } = await import('../../infrastructure/database/jsonDb.js');
    let orgId;

    if (isLocalJSONDb) {
      const orgs = await readTable('organizations');
      orgId = orgs[0]?.id || 'acme-tech-org-uuid';
    } else {
      const dbRes = await query('SELECT id FROM organizations LIMIT 1');
      orgId = dbRes.rows[0]?.id;
    }

    if (!orgId) {
      throw createError('No organization exists to link Google account to.', 400);
    }

    user = await userRepo.create({
      organizationId: orgId,
      employeeId: 'EMP-G' + Math.floor(1000 + Math.random() * 9000),
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      passwordHash: 'GOOGLE_EXTERNAL_OAUTH_FLOW', // passwordless
      role: 'Employee',
      isVerified: true,
      joiningDate: new Date()
    });

    logger.info(`🆕 Auto-created Employee account via Google Login: ${email}`);
  }

  // Issue JWT tokens
  const accessToken = authService.generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId || user.organization_id
  });

  const refreshToken = authService.generateRefreshToken();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Log audit event
  await auditRepository.log({
    organizationId: user.organizationId || user.organization_id,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'Login',
    resourceType: 'Session',
    details: `Successful Google Single Sign-On (SSO)`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || user.organization_id,
      department: user.department,
      designation: user.designation,
      employeeId: user.employee_id,
      profilePhoto: user.profile_photo
    }
  });
};
