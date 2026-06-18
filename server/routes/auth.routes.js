import express from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refreshToken);
router.get('/me',        protect, getMe);

export default router;