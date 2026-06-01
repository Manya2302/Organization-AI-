// ============================================================
// Routes: AI Copilot (RAG)
// ============================================================
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getAIStatus, chat, getSessions, getSessionMessages } from '../controllers/ai.controller.js';

const router = Router();
router.use(authenticate);

router.get('/status', getAIStatus);
router.post('/chat', chat);
router.get('/sessions', getSessions);
router.get('/sessions/:id/messages', getSessionMessages);

export default router;
