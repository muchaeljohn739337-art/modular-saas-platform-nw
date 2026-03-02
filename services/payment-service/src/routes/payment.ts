import express from 'express';
import { z } from 'zod';
import { PaymentController } from '../controllers/paymentController';
import { validateRequest } from '../middleware/validation';

const router = express.Router();
const paymentController = new PaymentController();

// Validation schemas
const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'ACH_TRANSFER', 'HEALTH_SAVINGS_ACCOUNT', 'FLEXIBLE_SPENDING_ACCOUNT']),
  paymentDetails: z.object({
    // Credit/Debit card details
    cardNumber: z.string().optional(),
    expiryMonth: z.number().min(1).max(12).optional(),
    expiryYear: z.number().min(new Date().getFullYear()).optional(),
    cvv: z.string().optional(),
    cardholderName: z.string().optional(),
    
    // ACH details
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    accountType: z.enum(['CHECKING', 'SAVINGS']).optional(),
    accountHolderName: z.string().optional(),
    
    // HSA/FSA details
    hsaCardNumber: z.string().optional(),
    fsaCardNumber: z.string().optional()
  }).optional()
});

const refundPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Refund amount must be greater than 0'),
  reason: z.string().min(1, 'Refund reason is required')
});

// Payment routes
router.post('/', validateRequest(createPaymentSchema), paymentController.createPayment);
router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPayment);
router.post('/:id/capture', paymentController.capturePayment);
router.post('/:id/refund', validateRequest(refundPaymentSchema), paymentController.refundPayment);
router.delete('/:id', paymentController.cancelPayment);

// Payment method routes
router.get('/methods', paymentController.getPaymentMethods);
router.post('/methods', paymentController.addPaymentMethod);
router.put('/methods/:id', paymentController.updatePaymentMethod);
router.delete('/methods/:id', paymentController.removePaymentMethod);

// Transaction routes
router.get('/transactions', paymentController.getTransactions);
router.get('/transactions/:id', paymentController.getTransaction);

// Reporting routes
router.get('/reports/summary', paymentController.getPaymentSummary);
router.get('/reports/methods', paymentController.getPaymentMethodReport);
router.get('/reports/failures', paymentController.getFailureReport);

export { router as paymentRouter };
