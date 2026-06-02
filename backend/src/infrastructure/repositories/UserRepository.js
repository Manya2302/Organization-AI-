// ============================================================
// Infrastructure: User Repository (PostgreSQL + JSON Fallback)
// ============================================================
import { query, withTransaction, isLocalJSONDb } from '../database/connection.js';
import { readTable, writeTable, insertRow, updateRow } from '../database/jsonDb.js';
import { User } from '../../core/entities/User.js';
import { logger } from '../logging/logger.js';

export class UserRepository {
  // Find by email (for login)
  async findByEmail(email) {
    if (isLocalJSONDb) {
      const users = await readTable('users');
      const u = users.find(user => user.email === email.toLowerCase() && user.is_active !== false);
      return u ? u : null;
    }
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1',
      [email.toLowerCase()]
    );
    return result.rows[0] ? result.rows[0] : null;
  }

  // Find by ID
  async findById(id) {
    if (isLocalJSONDb) {
      const users = await readTable('users');
      const u = users.find(user => user.id === id);
      if (!u) return null;
      const orgs = await readTable('organizations');
      const org = orgs.find(o => o.id === u.organization_id);
      return new User({
        ...u,
        org_name: org ? org.name : null
      });
    }

    // Guard against non-UUID identifiers
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !UUID_REGEX.test(id)) return null;

    const result = await query(
      'SELECT u.*, o.name as org_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = $1',
      [id]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Find all users for an organization
  async findByOrganization(organizationId, filters = {}) {
    if (isLocalJSONDb) {
      const users = await readTable('users');
      let filtered = users.filter(u => u.organization_id === organizationId && u.role !== 'SuperAdmin');
      if (filters.department) {
        filtered = filtered.filter(u => u.department === filters.department);
      }
      if (filters.role) {
        filtered = filtered.filter(u => u.role === filters.role);
      }
      if (typeof filters.isActive === 'boolean') {
        filtered = filtered.filter(u => u.is_active === filters.isActive);
      }
      // Sort by created_at DESC
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return filtered.map(row => new User(row));
    }
    let sql = 'SELECT * FROM users WHERE organization_id = $1 AND role != $2';
    const params = [organizationId, 'SuperAdmin'];
    let paramIdx = 3;

    if (filters.department) {
      sql += ` AND department = $${paramIdx++}`;
      params.push(filters.department);
    }
    if (filters.role) {
      sql += ` AND role = $${paramIdx++}`;
      params.push(filters.role);
    }
    if (typeof filters.isActive === 'boolean') {
      sql += ` AND is_active = $${paramIdx++}`;
      params.push(filters.isActive);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows.map(row => new User(row));
  }

  // Create a new user
  async create(userData) {
    if (isLocalJSONDb) {
      const u = {
        organization_id: userData.organizationId || null,
        employee_id: userData.employeeId || null,
        name: userData.name,
        email: userData.email.toLowerCase(),
        password_hash: userData.passwordHash,
        role: userData.role || 'Employee',
        department: userData.department || null,
        designation: userData.designation || null,
        joining_date: userData.joiningDate || new Date().toISOString(),
        mobile_number: userData.mobileNumber || null,
        skills: userData.skills || [],
        is_verified: userData.isVerified || false,
        is_active: true
      };
      const inserted = await insertRow('users', u);
      return new User(inserted);
    }
    const result = await query(
      `INSERT INTO users (
        organization_id, employee_id, name, email, password_hash, role,
        department, designation, joining_date, mobile_number, skills, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userData.organizationId || null,
        userData.employeeId || null,
        userData.name,
        userData.email.toLowerCase(),
        userData.passwordHash,
        userData.role || 'Employee',
        userData.department || null,
        userData.designation || null,
        userData.joiningDate || new Date(),
        userData.mobileNumber || null,
        JSON.stringify(userData.skills || []),
        userData.isVerified || false
      ]
    );
    return new User(result.rows[0]);
  }

  // Update user profile
  async update(id, updates) {
    if (isLocalJSONDb) {
      const dbUpdates = {};
      const fieldMap = {
        name: 'name', department: 'department', designation: 'designation',
        mobileNumber: 'mobile_number', skills: 'skills', profilePhoto: 'profile_photo',
        isActive: 'is_active', isVerified: 'is_verified', passwordHash: 'password_hash',
        lastLoginAt: 'last_login_at'
      };
      for (const [key, col] of Object.entries(fieldMap)) {
        if (updates[key] !== undefined) {
          dbUpdates[col] = updates[key];
        }
      }
      const updated = await updateRow('users', id, dbUpdates);
      return updated ? new User(updated) : null;
    }
    const fields = [];
    const values = [];
    let idx = 1;

    const fieldMap = {
      name: 'name', department: 'department', designation: 'designation',
      mobileNumber: 'mobile_number', skills: 'skills', profilePhoto: 'profile_photo',
      isActive: 'is_active', isVerified: 'is_verified', passwordHash: 'password_hash',
      lastLoginAt: 'last_login_at'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(key === 'skills' ? JSON.stringify(updates[key]) : updates[key]);
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Soft delete / deactivate user
  async deactivate(id) {
    if (isLocalJSONDb) {
      const updated = await updateRow('users', id, { is_active: false });
      return updated ? new User(updated) : null;
    }
    const result = await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Count users in org
  async countByOrganization(organizationId) {
    if (isLocalJSONDb) {
      const users = await readTable('users');
      return users.filter(u => u.organization_id === organizationId && u.is_active !== false).length;
    }
    const result = await query(
      'SELECT COUNT(*) FROM users WHERE organization_id = $1 AND is_active = TRUE',
      [organizationId]
    );
    return parseInt(result.rows[0].count);
  }
}

export default new UserRepository();

