// ============================================================
// Service: AI Processing Job Recovery Service
// Handles logging, automatic retry, and manual resume of jobs
// ============================================================
import { query } from '../../infrastructure/database/connection.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { enqueueDocumentJob } from '../../infrastructure/jobs/AIQueueService.js';

export const logJobFailure = async (jobId, documentId, stage, errorMessage) => {
  try {
    // Check if failure entry already exists
    const existing = await query(
      `SELECT id, retry_count FROM document_job_failures WHERE job_id = $1 AND resolved = false`,
      [jobId]
    );

    if (existing.rows.length > 0) {
      const fail = existing.rows[0];
      const newRetryCount = fail.retry_count + 1;
      await query(
        `UPDATE document_job_failures 
         SET retry_count = $1, error_message = $2, last_retry_at = NOW()
         WHERE id = $3`,
        [newRetryCount, errorMessage, fail.id]
      );
      logger.info(`🔄 Incremented retry count for failed job ${jobId} to ${newRetryCount}`);
      return { id: fail.id, retryCount: newRetryCount };
    } else {
      const res = await query(
        `INSERT INTO document_job_failures (job_id, document_id, failed_stage, error_message, retry_count)
         VALUES ($1, $2, $3, $4, 0) RETURNING id`,
        [jobId, documentId, stage || 'ocr', errorMessage]
      );
      logger.info(`⚠️ Logged new processing job failure: job=${jobId}, doc=${documentId}`);
      return { id: res.rows[0].id, retryCount: 0 };
    }
  } catch (err) {
    logger.error(`Error logging job failure: ${err.message}`);
    return null;
  }
};

export const getFailedJobs = async (organizationId) => {
  const res = await query(
    `SELECT f.*, d.name as document_name 
     FROM document_job_failures f
     JOIN documents d ON f.document_id = d.id
     WHERE d.organization_id = $1 AND f.resolved = false
     ORDER BY f.created_at DESC`,
    [organizationId]
  );
  return res.rows;
};

export const retryFailedJob = async (failureId, organizationId) => {
  try {
    const res = await query(
      `SELECT f.*, d.name as document_name, d.owner_id 
       FROM document_job_failures f
       JOIN documents d ON f.document_id = d.id
       WHERE f.id = $1 AND d.organization_id = $2`,
      [failureId, organizationId]
    );

    if (res.rows.length === 0) {
      throw new Error('Failure record not found or unauthorized');
    }

    const fail = res.rows[0];

    // Enqueue document job again
    const newJobId = await enqueueDocumentJob({
      documentId: fail.document_id,
      organizationId,
      userId: fail.owner_id,
      documentName: fail.document_name
    });

    // Mark current failure as resolved
    await query(
      `UPDATE document_job_failures SET resolved = true WHERE id = $1`,
      [failureId]
    );

    logger.info(`🔄 Re-enqueued failed job ${fail.job_id} under new job ID ${newJobId}`);
    return { success: true, newJobId };
  } catch (err) {
    logger.error(`Failed to retry job: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const escalatePermanentFailures = async (organizationId) => {
  // Find jobs with retry_count >= 3
  const res = await query(
    `SELECT f.*, d.name as document_name
     FROM document_job_failures f
     JOIN documents d ON f.document_id = d.id
     WHERE d.organization_id = $1 AND f.retry_count >= 3 AND f.resolved = false`,
    [organizationId]
  );

  for (const fail of res.rows) {
    // Log a security/system critical alert
    logger.warn(`🚨 Job ${fail.job_id} for document "${fail.document_name}" has failed 3+ times. Escalating...`);
    // Here we could publish a notification or log a system event
    await query(
      `INSERT INTO system_events (organization_id, event_type, payload)
       VALUES ($1, 'Processing Escalated', $2::jsonb)`,
      [organizationId, JSON.stringify({ jobId: fail.job_id, documentId: fail.document_id, stage: fail.failed_stage, error: fail.error_message })]
    );
  }

  return res.rows;
};

export default { logJobFailure, getFailedJobs, retryFailedJob, escalatePermanentFailures };
