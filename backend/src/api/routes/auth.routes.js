// ============================================================
// Routes: Authentication
// ============================================================
import { Router } from 'express';
import { sendOTP, login, registerOrganization, registerEmployee, forgotPassword, resetPassword, logout, getMe, googleLogin } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/send-otp', authRateLimiter, sendOTP);
router.post('/login', authRateLimiter, login);
router.post('/google-login', googleLogin);
router.post('/register-organization', registerOrganization);
router.post('/register-employee', registerEmployee);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
