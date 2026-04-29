import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import {
  getSummary,
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadPDF,
  emailInvoice,
  setPaid,
} from '../controllers/invoiceController.js';

const router = express.Router();
router.use(protect);

router.get('/summary', getSummary);
router.get('/', listInvoices);
router.get('/:id/pdf', downloadPDF);
router.post('/:id/email', emailInvoice);
router.post('/:id/paid', [body('paid').isIn([true, false])], setPaid);
router.get('/:id', getInvoice);
router.post(
  '/',
  [
    body('clientId').notEmpty(),
    body('dueDate').isISO8601(),
    body('items').isArray({ min: 1 }),
    body('items.*.name').trim().notEmpty(),
    body('items.*.rate').isFloat({ min: 0 }),
    body('items.*.quantity').isFloat({ min: 0 }),
  ],
  createInvoice
);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
