import express from 'express';
import { z } from 'zod';
import { BillingController } from '../controllers/billingController';
import { validateRequest } from '../middleware/validation';
import { requireRole } from '../middleware/auth';

const router = express.Router();
const billingController = new BillingController();

// Validation schemas
const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  items: z.array(z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative')
  })).min(1, 'At least one item is required'),
  dueDate: z.string().datetime('Invalid due date format'),
  serviceDate: z.string().datetime('Invalid service date format')
});

const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'CANCELLED', 'VOID']).optional(),
  dueDate: z.string().datetime().optional()
});

const addItemSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  description: z.string().optional()
});

// Invoice routes
router.post('/invoices', validateRequest(createInvoiceSchema), billingController.createInvoice);
router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.put('/invoices/:id', validateRequest(updateInvoiceSchema), billingController.updateInvoice);
router.delete('/invoices/:id', billingController.deleteInvoice);
router.post('/invoices/:id/send', billingController.sendInvoice);
router.post('/invoices/:id/items', validateRequest(addItemSchema), billingController.addInvoiceItem);
router.delete('/invoices/:id/items/:itemId', billingController.removeInvoiceItem);

// Service routes
router.get('/services', billingController.getServices);
router.post('/services', requireRole(['PROVIDER', 'ADMIN']), billingController.createService);
router.put('/services/:id', requireRole(['PROVIDER', 'ADMIN']), billingController.updateService);
router.delete('/services/:id', requireRole(['ADMIN']), billingController.deleteService);

// Reporting routes
router.get('/reports/revenue', billingController.getRevenueReport);
router.get('/reports/aging', billingController.getAgingReport);
router.get('/reports/unpaid', billingController.getUnpaidInvoices);

// Patient billing routes
router.get('/patients/:patientId/invoices', billingController.getPatientInvoices);
router.get('/patients/:patientId/balance', billingController.getPatientBalance);

export { router as billingRouter };
