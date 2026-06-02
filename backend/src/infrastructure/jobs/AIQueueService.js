// AI Processing Queue — Phase 2
// Redis-backed async job queue for document processing
import { logger } from '../logging/logger.js';

// Simple in-memory queue fallback when Redis is unavailable
const memoryQueue = [];
const jobStatus = new Map();

let redisClient = null;
let redisConnectionFailed = false;

const getRedis = async () => {
  if (redisClient) return redisClient;
  if (redisConnectionFailed) return null;
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    
    // Add simple listener for connection issues
    client.on('error', (err) => {
      // Catch connection errors silently in background
    });

    await client.connect();
    redisClient = client;
    logger.info('✅ Redis connected for AI job queue');
    return client;
  } catch (err) {
    redisConnectionFailed = true;
    logger.warn('⚠️  Redis unavailable, using in-memory queue (suppressing further connection warnings)');
    return null;
  }
};

export const enqueueDocumentJob = async (job) => {
  const jobData = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId: job.documentId,
    organizationId: job.organizationId,
    userId: job.userId,
    documentName: job.documentName,
    hasOcrText: job.hasOcrText || false,
    stages: ['ocr', 'classify', 'embed', 'summarize', 'sensitivity', 'entities', 'relationships', 'knowledge'],
    currentStage: 'queued',
    status: 'queued',
    createdAt: new Date().toISOString(),
    attempts: 0,
    maxAttempts: 3
  };

  jobStatus.set(jobData.id, jobData);

  const redis = await getRedis();
  if (redis) {
    try {
      await redis.lPush('ai:processing:queue', JSON.stringify(jobData));
      logger.info(`📥 Job ${jobData.id} enqueued to Redis for doc ${job.documentId}`);
    } catch {
      memoryQueue.push(jobData);
    }
  } else {
    memoryQueue.push(jobData);
  }

  return jobData.id;
};

export const getJobStatus = (jobId) => jobStatus.get(jobId) || null;

export const updateJobStatus = (jobId, updates) => {
  const job = jobStatus.get(jobId);
  if (job) jobStatus.set(jobId, { ...job, ...updates, updatedAt: new Date().toISOString() });
};

export const getQueueStats = async () => {
  const redis = await getRedis();
  let queueLength = memoryQueue.length;
  if (redis) {
    try { queueLength = await redis.lLen('ai:processing:queue'); } catch {}
  }

  const jobs = Array.from(jobStatus.values());
  return {
    queueLength,
    totalJobs: jobs.length,
    queued: jobs.filter(j => j.status === 'queued').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    redisConnected: !!redis
  };
};

export const dequeueJob = async () => {
  const redis = await getRedis();
  if (redis) {
    try {
      const data = await redis.rPop('ai:processing:queue');
      return data ? JSON.parse(data) : null;
    } catch {}
  }
  return memoryQueue.pop() || null;
};

export default { enqueueDocumentJob, getJobStatus, updateJobStatus, getQueueStats, dequeueJob };
