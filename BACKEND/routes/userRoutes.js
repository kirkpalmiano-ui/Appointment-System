import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  confirmEmailChange,
  deleteUser,
  getProfile,
  removeAvatar,
  listUsers,
  requestEmailChange,
  resendEmailChange,
  unlockUser,
  updateAvatar,
  updateProfile,
  updateUserRole,
} from '../controllers/userController.js';
import { protect, requireAdmin, requirePasswordConfirmation } from '../middleware/auth.js';
import {
  emailChangeResendRules,
  emailChangeRules,
  emailChangeVerifyRules,
  listUsersRules,
  mongoIdParam,
  roleRules,
  updateProfileRules,
} from '../validators/rules.js';
import { parseAvatarUpload } from '../utils/avatar.js';

const router = Router();

// Email change sends emails and checks codes, so it gets the same per-IP cap as auth.
const emailChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
});

router.use(protect);

router.route('/me').get(getProfile).put(updateProfileRules, updateProfile);

// Profile photo upload (multipart). Limited per IP because each upload is sent on to Cloudinary.
const avatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many photo uploads. Please try again in an hour.' },
});
router.route('/me/avatar').put(avatarLimiter, parseAvatarUpload, updateAvatar).delete(avatarLimiter, removeAvatar);
router.post('/me/email', emailChangeLimiter, emailChangeRules, requestEmailChange);
router.post('/me/email/verify', emailChangeLimiter, emailChangeVerifyRules, confirmEmailChange);
router.post('/me/email/resend', emailChangeLimiter, emailChangeResendRules, resendEmailChange);

// Admin panel only. Role changes and deletions also require re-entering the password.
router.get('/', requireAdmin, listUsersRules, listUsers);
router.patch('/:id/role', requireAdmin, roleRules, requirePasswordConfirmation, updateUserRole);
router.patch('/:id/unlock', requireAdmin, mongoIdParam, unlockUser);
router.delete('/:id', requireAdmin, mongoIdParam, requirePasswordConfirmation, deleteUser);

export default router;
