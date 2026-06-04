// ============================================================
// Database Migration — OTP Performance Indexes
// Run: node src/infrastructure/database/migrate_otp_indexes.js
// ============================================================
import { query, connectDB } from './connection.js';
import { logger } from '../logging/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const migrations = [
  // Primary lookup index used on every OTP verify call
  `CREATE INDEX IF NOT EXISTS idx_otp_email_purpose_active
   ON otp_verifications (email, purpose, is_used, expires_at DESC)`,

  // Mark-used query (UPDATE by id)
  `CREATE INDEX IF NOT EXISTS idx_otp_id_active
   ON otp_verifications (id) WHERE is_used = FALSE`,

  // Cleanup queries — expire old rows
  `CREATE INDEX IF NOT EXISTS idx_otp_expires_at
   ON otp_verifications (expires_at) WHERE is_used = FALSE`,

  // Users table — lookup by email (used in every login/register check)
  `CREATE INDEX IF NOT EXISTS idx_users_email_lower
   ON users (LOWER(email))`,

  // Refresh tokens — user revocation on logout
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
   ON refresh_tokens (user_id, is_revoked) WHERE is_revoked = FALSE`,

  // Audit log inserts — org + timestamp for dashboard queries
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_org_ts
   ON audit_logs (organization_id, created_at DESC)`
];

const run = async () => {
  try {
    await connectDB();
    logger.info('⚡ Running OTP & auth performance index migrations...');
    let ok = 0;
    for (let i = 0; i < migrations.length; i++) {
      const name = migrations[i].match(/idx_\w+/)?.[0] || `step_${i + 1}`;
      try {
        await query(migrations[i]);
        logger.info(`  ✅ (${i + 1}/${migrations.length}) ${name}`);
        ok++;
      } catch (err) {
        logger.warn(`  ⚠️  Skipped ${name}: ${err.message}`);
      }
    }
    logger.info(`\n✅ Index migration complete — ${ok}/${migrations.length} applied`);
    process.exit(0);
  } catch (err) {
    logger.error('❌ Index migration failed:', err);
    process.exit(1);
  }
};

run();
