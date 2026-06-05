// ============================================================
// Infrastructure Layer: PostgreSQL Database Connection
// ============================================================
import pg from 'pg';
import dotenv from 'dotenv';
import { logger } from '../logging/logger.js';

dotenv.config();

const { Pool } = pg;

// Connection Pool Configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'securevault_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,                    // Max pool size
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000,
});

// Fallback status
export let isLocalJSONDb = false;

// Pool error handler
pool.on('error', (err) => {
  if (!isLocalJSONDb) {
    logger.error('Unexpected PostgreSQL pool error:', err);
  }
});

// Test database connectivity
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    isLocalJSONDb = false;
    return true;
  } catch (error) {
    logger.warn('⚠️ PostgreSQL offline. Falling back to zero-install Local JSON Database mode.');
    isLocalJSONDb = true;
    try {
      const { seedLocalJSONDbIfEmpty } = await import('./jsonDb.js');
      await seedLocalJSONDbIfEmpty();
    } catch (e) {
      logger.error('JSON DB seed failed:', e);
    }
    return true;
  }
};

// Initialize connection
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    isLocalJSONDb = false;
    logger.info(`Connected to: ${result.rows[0].version.split(',')[0]}`);
    
    // Auto-run Phase 4 workflows migration on startup
    try {
      const { migrateWorkflows } = await import('./migrate_compliance_workflows.js');
      await migrateWorkflows();
    } catch (migErr) {
      logger.error('Workflows migration failed:', migErr);
    }

    // Auto-run Phase 5 Audit Copilot migration on startup
    try {
      const { migrateAuditCopilot } = await import('./migrate_phase5_audit_copilot.js');
      await migrateAuditCopilot();
    } catch (migErr) {
      logger.error('Phase 5 migrations failed:', migErr);
    }

    return pool;
  } catch (error) {
    logger.warn('⚠️ PostgreSQL offline. Initialized with Local JSON Database.');
    isLocalJSONDb = true;
    try {
      const { seedLocalJSONDbIfEmpty } = await import('./jsonDb.js');
      await seedLocalJSONDbIfEmpty();
    } catch (e) {
      logger.error('JSON DB seed failed:', e);
    }
    return null;
  }
};

// Query executor with logging
export const query = async (text, params) => {
  if (isLocalJSONDb) {
    // Return empty results/simulate response
    return { rows: [] };
  }
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 80)}...`);
    }
    return result;
  } catch (error) {
    logger.error(`Query failed: ${text.substring(0, 80)}`, error.message);
    throw error;
  }
};

// Transaction helper
export const withTransaction = async (callback) => {
  if (isLocalJSONDb) {
    return await callback(null);
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;

