import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuditService } from '../services/auditService';
import { PaymentProcessorService } from '../services/paymentProcessorService';
import { FraudDetectionService } from '../services/fraudDetectionService';
import { NotificationService } from '../services/notificationService';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const auditService = new AuditService();
const paymentProcessor = new PaymentProcessorService();
const fraudDetection = new FraudDetectionService();
const notificationService = new NotificationService();

export class PaymentController {
  async createPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { invoiceId, amount, method, paymentDetails } = req.body;

      // Validate invoice exists and get details
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          patient: { include: { user: true } },
          provider: { include: { user: true } }
        }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (invoice.balance <= 0) {
        return res.status(400).json({ error: 'Invoice has no balance due' });
      }

      if (amount > invoice.balance) {
        return res.status(400).json({ error: 'Payment amount exceeds balance due' });
      }

      // Fraud detection
      const fraudCheck = await fraudDetection.analyzePayment({
        userId,
        invoiceId,
        amount,
        method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (fraudCheck.isSuspicious) {
        await auditService.log({
          userId,
          action: 'PAYMENT_BLOCKED_FRAUD',
          resource: 'Payment',
          resourceId: 'pending',
          newValues: { invoiceId, amount, method, reason: fraudCheck.reason },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(400).json({ 
          error: 'Payment blocked for security reasons',
          reason: fraudCheck.reason
        });
      }

      // Generate payment number and transaction ID
      const paymentNumber = `PAY${Date.now()}`;
      const transactionId = uuidv4();

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          paymentNumber,
          patientId: invoice.patientId,
          invoiceId,
          accountId: invoice.accountId,
          amount,
          method,
          status: PaymentStatus.PENDING,
          transactionId
        },
        include: {
          patient: { include: { user: true } },
          invoice: true
        }
      });

      // Process payment based on method
      let processorResponse;
      try {
        processorResponse = await paymentProcessor.processPayment({
          paymentId: payment.id,
          amount,
          method,
          paymentDetails,
          customerInfo: {
            name: invoice.patient.user.name,
            email: invoice.patient.user.email
          },
          invoiceInfo: {
            invoiceNumber: invoice.invoiceNumber,
            description: `Payment for invoice ${invoice.invoiceNumber}`
          }
        });
      } catch (error) {
        // Payment processing failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            processorResponse: { error: error.message }
          }
        });

        await auditService.log({
          userId,
          action: 'PAYMENT_FAILED',
          resource: 'Payment',
          resourceId: payment.id,
          newValues: { invoiceId, amount, method, error: error.message },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        logger.error(`Payment processing failed: ${paymentNumber}`, error);
        return res.status(400).json({ error: 'Payment processing failed' });
      }

      // Update payment with processor response
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PROCESSING,
          processorResponse
        },
        include: {
          patient: { include: { user: true } },
          invoice: true
        }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'PAYMENT_CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        newValues: {
          paymentNumber,
          invoiceId,
          amount,
          method,
          transactionId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Payment created: ${paymentNumber}`);

      res.status(201).json({
        message: 'Payment initiated successfully',
        payment: updatedPayment
      });
    } catch (error) {
      logger.error('Create payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPayments(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        method,
        patientId,
        invoiceId,
        startDate,
        endDate
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) where.status = status;
      if (method) where.method = method;
      if (patientId) where.patientId = patientId;
      if (invoiceId) where.invoiceId = invoiceId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              include: { user: { select: { name: true, email: true } } }
            },
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                status: true
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          patient: {
            include: { user: true }
          },
          invoice: {
            include: {
              provider: { include: { user: true } },
              items: { include: { service: true } }
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({ payment });
    } catch (error) {
      logger.error('Get payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async capturePayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
          patient: { include: { user: true } }
        }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status !== PaymentStatus.PROCESSING) {
        return res.status(400).json({ error: 'Payment cannot be captured' });
      }

      // Capture payment with processor
      const captureResult = await paymentProcessor.capturePayment(payment.id);

      if (captureResult.success) {
        // Update payment status
        const updatedPayment = await prisma.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.COMPLETED,
            processedAt: new Date(),
            processorResponse: captureResult.data
          },
          include: {
            patient: { include: { user: true } },
            invoice: true
          }
        });

        // Update invoice balance
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: {
              increment: payment.amount
            },
            balance: {
              decrement: payment.amount
            }
          }
        });

        // Send confirmation notification
        await notificationService.sendPaymentConfirmation(
          payment.patient.user.email,
          updatedPayment
        );

        // Log audit
        await auditService.log({
          userId,
          action: 'PAYMENT_CAPTURE',
          resource: 'Payment',
          resourceId: payment.id,
          newValues: { status: 'COMPLETED', processedAt: new Date() },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        logger.info(`Payment captured: ${payment.paymentNumber}`);

        res.json({
          message: 'Payment captured successfully',
          payment: updatedPayment
        });
      } else {
        // Payment capture failed
        await prisma.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.FAILED,
            processorResponse: captureResult.error
          }
        });

        res.status(400).json({
          error: 'Payment capture failed',
          details: captureResult.error
        });
      }
    } catch (error) {
      logger.error('Capture payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refundPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const { amount, reason } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
          patient: { include: { user: true } }
        }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        return res.status(400).json({ error: 'Only completed payments can be refunded' });
      }

      if (amount > payment.amount) {
        return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
      }

      // Process refund with payment processor
      const refundResult = await paymentProcessor.refundPayment(payment.id, amount, reason);

      if (refundResult.success) {
        // Create refund record
        const refund = await prisma.payment.create({
          data: {
            paymentNumber: `REF${Date.now()}`,
            patientId: payment.patientId,
            invoiceId: payment.invoiceId,
            accountId: payment.accountId,
            amount: -amount, // Negative amount for refund
            method: payment.method,
            status: PaymentStatus.COMPLETED,
            transactionId: uuidv4(),
            processedAt: new Date(),
            processorResponse: refundResult.data
          },
          include: {
            patient: { include: { user: true } },
            invoice: true
          }
        });

        // Update invoice balance
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: {
              decrement: amount
            },
            balance: {
              increment: amount
            }
          }
        });

        // Log audit
        await auditService.log({
          userId,
          action: 'PAYMENT_REFUND',
          resource: 'Payment',
          resourceId: refund.id,
          newValues: { amount: -amount, reason, originalPaymentId: payment.id },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        logger.info(`Payment refund processed: ${refund.paymentNumber}`);

        res.status(201).json({
          message: 'Refund processed successfully',
          refund
        });
      } else {
        res.status(400).json({
          error: 'Refund processing failed',
          details: refundResult.error
        });
      }
    } catch (error) {
      logger.error('Refund payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async cancelPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        return res.status(400).json({ error: 'Completed payments cannot be cancelled' });
      }

      // Cancel payment with processor
      if (payment.status === PaymentStatus.PROCESSING) {
        await paymentProcessor.cancelPayment(payment.id);
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: { status: PaymentStatus.CANCELLED }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'PAYMENT_CANCEL',
        resource: 'Payment',
        resourceId: payment.id,
        newValues: { status: 'CANCELLED' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Payment cancelled: ${payment.paymentNumber}`);

      res.json({
        message: 'Payment cancelled successfully',
        payment: updatedPayment
      });
    } catch (error) {
      logger.error('Cancel payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPaymentMethods(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;

      // In a real implementation, you would store payment methods in the database
      // For now, we'll return a mock response
      const paymentMethods = [
        {
          id: 'pm_1',
          type: 'CREDIT_CARD',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        },
        {
          id: 'pm_2',
          type: 'BANK_ACCOUNT',
          last4: '6789',
          bankName: 'Chase Bank',
          accountType: 'CHECKING',
          isDefault: false
        }
      ];

      res.json({ paymentMethods });
    } catch (error) {
      logger.error('Get payment methods error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addPaymentMethod(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { type, details } = req.body;

      // In a real implementation, you would:
      // 1. Validate payment method details
      // 2. Tokenize with payment processor
      // 3. Store in database

      const paymentMethod = {
        id: `pm_${Date.now()}`,
        type,
        last4: details.last4 || '****',
        isDefault: false
      };

      res.status(201).json({
        message: 'Payment method added successfully',
        paymentMethod
      });
    } catch (error) {
      logger.error('Add payment method error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePaymentMethod(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isDefault } = req.body;

      // Update payment method logic here

      res.json({
        message: 'Payment method updated successfully'
      });
    } catch (error) {
      logger.error('Update payment method error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removePaymentMethod(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Remove payment method logic here

      res.json({
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      logger.error('Remove payment method error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTransactions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, method } = req.query;

      // Transaction logic here - this would typically include all payment activities
      const transactions = [];

      res.json({
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      });
    } catch (error) {
      logger.error('Get transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get specific transaction logic here

      res.json({ transaction: null });
    } catch (error) {
      logger.error('Get transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPaymentSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const summary = await prisma.payment.groupBy({
        by: ['status', 'method'],
        where,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      const totalProcessed = summary
        .filter(item => item.status === PaymentStatus.COMPLETED)
        .reduce((sum, item) => sum + (item._sum.amount || 0), 0);

      const totalFailed = summary
        .filter(item => item.status === PaymentStatus.FAILED)
        .reduce((sum, item) => sum + (item._sum.amount || 0), 0);

      res.json({
        period: { startDate, endDate },
        summary: {
          totalProcessed,
          totalFailed,
          transactionCount: summary.reduce((sum, item) => sum + item._count.id, 0)
        },
        breakdown: summary
      });
    } catch (error) {
      logger.error('Get payment summary error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPaymentMethodReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const where: any = { status: PaymentStatus.COMPLETED };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const methodStats = await prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      res.json({
        period: { startDate, endDate },
        methods: methodStats.map(stat => ({
          method: stat.method,
          totalAmount: stat._sum.amount || 0,
          transactionCount: stat._count.id,
          averageAmount: stat._count.id > 0 ? (stat._sum.amount || 0) / stat._count.id : 0
        }))
      });
    } catch (error) {
      logger.error('Get payment method report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFailureReport(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, startDate, endDate } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { status: PaymentStatus.FAILED };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [failures, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              include: { user: { select: { name: true, email: true } } }
            },
            invoice: {
              select: { invoiceNumber: true }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      res.json({
        failures,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get failure report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
