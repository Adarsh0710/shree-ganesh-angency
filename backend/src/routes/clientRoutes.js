import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { listClients, getClient, createClient, updateClient, deleteClient } from '../controllers/clientController.js';

const router = express.Router();
router.use(protect);

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', [body('name').trim().notEmpty()], createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
