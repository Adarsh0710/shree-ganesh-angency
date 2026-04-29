import express from 'express';
import { protect } from '../middleware/auth.js';
import { updateProfile } from '../controllers/userController.js';
import { uploadLogo } from '../config/upload.js';

const router = express.Router();
router.put('/', protect, uploadLogo.single('logo'), updateProfile);

export default router;
