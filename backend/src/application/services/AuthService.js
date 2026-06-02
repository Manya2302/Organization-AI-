// ============================================================
// Application Service: Authentication Service (PostgreSQL + JSON Fallback)
// JWT + bcrypt + OTP verification
// ============================================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, isLocalJSONDb } from '../../infrastructure/database/connection.js';
import { readTable, writeTable, insertRow, updateRow } from '../../infrastructure/database/jsonDb.js';
import userRepository from '../../infrastructure/repositories/UserRepository.js';
import { logger } from '../../infrastructure/logging/logger.js';
import emailService from '../../infrastructure/services/EmailService.js';

// ── In-memory token → user cache (TTL = 5 min) to avoid DB hit on every request ──
const _tokenCache = new Map(); // token -> { user, expiresAt }
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

const _getCachedUser = (token) => {
  const entry = _tokenCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _tokenCache.delete(token);
    return null;
  }
  return entry.user;
};

const _setCachedUser = (token, user) => {
  if (_tokenCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const firstKey = _tokenCache.keys().next().value;
    _tokenCache.delete(firstKey);
  }
  _tokenCache.set(token, { user, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
};

const _invalidateCacheForUser = (userId) => {
  for (const [token, entry] of _tokenCache.entries()) {
    if (entry.user?.id === userId) _tokenCache.delete(token);
  }
};

export class AuthService {
  // Generate JWT access token
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || user.organization_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Generate refresh token
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Hash password
  async hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
  }

  // Compare password
  async verifyPassword(plainText, hash) {
    return await bcrypt.compare(plainText, hash);
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in database
  async storeOTP(email, purpose, ipAddress = null) {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60000).toISOString();

    if (isLocalJSONDb) {
      const otps = await readTable('otp_verifications');
      // Invalidate existing OTPs for this email/purpose
      const updatedOtps = otps.map(o => {
        if (o.email === email.toLowerCase() && o.purpose === purpose && o.is_used === false) {
          return { ...o, is_used: true };
        }
        return o;
      });
      await writeTable('otp_verifications', updatedOtps);

      const otpRow = {
        email: email.toLowerCase(),
        otp_code: otp,
        purpose,
        expires_at: expiresAt,
        is_used: false,
        attempts: 0,
        ip_address: ipAddress
      };
      await insertRow('otp_verifications', otpRow);
    } else {
      // Invalidate existing OTPs for this email/purpose
      await query(
        'UPDATE otp_verifications SET is_used = TRUE WHERE email = $1 AND purpose = $2 AND is_used = FALSE',
        [email.toLowerCase(), purpose]
      );

      await query(
        `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [email.toLowerCase(), otp, purpose, expiresAt, ipAddress]
      );
    }

    logger.info(`OTP generated for ${email} (purpose: ${purpose}) — Sending via EmailService...`);
    // Send email asynchronously
    emailService.sendOTP(email, otp, purpose).catch(err => {
      logger.error(`Error sending email async:`, err);
    });

    // In development, log OTP for testing
    if (process.env.NODE_ENV === 'development' || isLocalJSONDb) {
      logger.info(`🔑 DEV OTP for ${email}: ${otp}`);
    }

    return otp;
  }

  // Verify OTP
  async verifyOTP(email, otpCode, purpose) {
    if (isLocalJSONDb) {
      const otps = await readTable('otp_verifications');
      const found = otps
        .filter(o => o.email === email.toLowerCase() && o.otp_code === otpCode && o.purpose === purpose && o.is_used === false && new Date(o.expires_at) > new Date())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!found) {
        return { valid: false, reason: 'Invalid or expired OTP code.' };
      }

      // Mark as used
      found.is_used = true;
      const idx = otps.findIndex(o => o.id === found.id);
      if (idx !== -1) {
        otps[idx] = found;
        await writeTable('otp_verifications', otps);
      }

      return { valid: true };
    }

    const result = await query(
      `SELECT * FROM otp_verifications
       WHERE email = $1 AND otp_code = $2 AND purpose = $3
         AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otpCode, purpose]
    );

    if (!result.rows[0]) {
      return { valid: false, reason: 'Invalid or expired OTP code.' };
    }

    // Mark as used
    await query(
      'UPDATE otp_verifications SET is_used = TRUE WHERE id = $1',
      [result.rows[0].id]
    );

    return { valid: true };
  }

  // Login: validate credentials and return tokens
  async login(email, password, role, organizationId = null, employeeId = null, ipAddress = null) {
    const rawUser = await userRepository.findByEmail(email);

    if (!rawUser) {
      logger.warn(`Login attempt for unknown email: ${email}`);
      return { success: false, message: 'Invalid email or password.' };
    }

    if (rawUser.is_active === false) {
      return { success: false, message: 'Account has been deactivated. Contact your administrator.' };
    }

    // Verify password
    const passwordValid = await this.verifyPassword(password, rawUser.password_hash);
    if (!passwordValid) {
      logger.warn(`Failed login attempt for: ${email}`);
      return { success: false, message: 'Invalid email or password.' };
    }

    // Verify role matches
    if (role && rawUser.role !== role && rawUser.role !== 'SuperAdmin') {
      return { success: false, message: `This account does not have the ${role} role.` };
    }

    // Update last login
    await userRepository.update(rawUser.id, { lastLoginAt: new Date().toISOString() });

    const accessToken = this.generateAccessToken({
      id: rawUser.id,
      email: rawUser.email,
      role: rawUser.role,
      organizationId: rawUser.organization_id
    });

    const refreshToken = this.generateRefreshToken();
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (isLocalJSONDb) {
      await insertRow('refresh_tokens', {
        user_id: rawUser.id,
        token_hash: refreshHash,
        expires_at: refreshExpiry,
        ip_address: ipAddress
      });
    } else {
      await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address) VALUES ($1, $2, $3, $4)',
        [rawUser.id, refreshHash, refreshExpiry, ipAddress]
      );
    }

    // Strip password hash before returning
    delete rawUser.password_hash;

    return {
      success: true,
      accessToken,
      refreshToken,
      user: rawUser
    };
  }

  // Register a new organization and its admin user
  async registerOrganization(orgData, adminData) {
    const existingUser = await userRepository.findByEmail(adminData.email);
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const passwordHash = await this.hashPassword(adminData.password);
    const slug = orgData.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);

    let org;
    if (isLocalJSONDb) {
      const orgRow = {
        name: orgData.companyName,
        slug,
        company_type: orgData.companyType || 'Private Limited',
        industry: orgData.industry || null,
        gst_number: orgData.gstNumber || null,
        company_email: orgData.companyEmail,
        contact_number: orgData.contactNumber || null,
        address: orgData.address || null,
        city: orgData.city || null,
        state: orgData.state || null,
        country: orgData.country || 'India',
        number_of_employees: orgData.numberOfEmployees || '1-10',
        is_active: true,
        subscription_plan: 'community',
        max_storage_gb: 10,
        max_users: 50,
        settings: {}
      };
      org = await insertRow('organizations', orgRow);
    } else {
      // Create organization
      const orgResult = await query(
        `INSERT INTO organizations (name, slug, company_type, industry, gst_number, company_email, contact_number, address, city, state, country, number_of_employees)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          orgData.companyName, slug, orgData.companyType || 'Private Limited',
          orgData.industry || null, orgData.gstNumber || null, orgData.companyEmail,
          orgData.contactNumber || null, orgData.address || null,
          orgData.city || null, orgData.state || null, orgData.country || 'India',
          orgData.numberOfEmployees || '1-10'
        ]
      );
      org = orgResult.rows[0];
    }

    // Create admin user
    const adminUser = await userRepository.create({
      organizationId: org.id,
      name: adminData.adminName,
      email: adminData.adminEmail,
      passwordHash,
      role: 'EnterpriseAdmin',
      isVerified: true,
      joiningDate: new Date()
    });

    const accessToken = this.generateAccessToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      organizationId: org.id
    });

    return { success: true, accessToken, organization: org, user: adminUser.toPublicJSON() };
  }

  // Verify JWT and return user data (with in-memory cache)
  async verifyToken(token) {
    try {
      // 1. Check cache first — avoids DB hit on every request
      const cached = _getCachedUser(token);
      if (cached) return cached;

      // 2. Validate JWT signature + expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Fetch fresh user from DB
      const user = await userRepository.findById(decoded.userId);
      if (!user || !user.isActive) return null;

      // 4. Cache for next requests
      _setCachedUser(token, user);
      return user;
    } catch {
      return null;
    }
  }

  // Logout: revoke refresh token + invalidate token cache
  async logout(userId) {
    // Invalidate all cached tokens for this user on logout
    _invalidateCacheForUser(userId);

    if (isLocalJSONDb) {
      const tokens = await readTable('refresh_tokens');
      const updated = tokens.map(t => {
        if (t.user_id === userId && t.is_revoked === false) {
          return { ...t, is_revoked: true };
        }
        return t;
      });
      await writeTable('refresh_tokens', updated);
      return;
    }
    await query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE',
      [userId]
    );
  }

  // Reset password
  async resetPassword(email, newPassword) {
    const rawUser = await userRepository.findByEmail(email);
    if (!rawUser) return { success: false, message: 'User not found.' };

    const passwordHash = await this.hashPassword(newPassword);
    await userRepository.update(rawUser.id, { passwordHash, passwordChangedAt: new Date().toISOString() });
    await this.logout(rawUser.id); // Revoke all sessions

    return { success: true };
  }
}

export default new AuthService();
