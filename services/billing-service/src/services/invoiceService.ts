import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class InvoiceService {
  async recalculateInvoiceTotal(invoiceId: string) {
    try {
      // Get all invoice items
      const items = await prisma.invoiceItem.findMany({
        where: { invoiceId }
      });

      // Calculate new total
      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

      // Get current payments
      const payments = await prisma.payment.findMany({
        where: {
          invoiceId,
          status: 'COMPLETED'
        }
      });

      const amountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = totalAmount - amountPaid;

      // Update invoice
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          totalAmount,
          amountPaid,
          balance
        },
        include: {
          items: { include: { service: true } },
          payments: true
        }
      });

      // Update status based on balance
      let newStatus = updatedInvoice.status;
      if (balance <= 0 && updatedInvoice.status !== InvoiceStatus.PAID) {
        newStatus = InvoiceStatus.PAID;
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: InvoiceStatus.PAID }
        });
      } else if (balance < totalAmount && updatedInvoice.status === InvoiceStatus.SENT) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: InvoiceStatus.PARTIALLY_PAID }
        });
      }

      logger.info(`Invoice total recalculated: ${invoiceId}`);

      return { ...updatedInvoice, status: newStatus };
    } catch (error) {
      logger.error('Recalculate invoice total error:', error);
      throw error;
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // Count invoices for this month
      const count = await prisma.invoice.count({
        where: {
          createdAt: {
            gte: new Date(year, today.getMonth(), 1),
            lt: new Date(year, today.getMonth() + 1, 1)
          }
        }
      });

      const sequence = String(count + 1).padStart(4, '0');
      return `INV-${year}${month}-${sequence}`;
    } catch (error) {
      logger.error('Generate invoice number error:', error);
      return `INV-${Date.now()}`;
    }
  }

  async validateInvoiceItems(items: any[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const item of items) {
      // Validate service exists
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId }
      });

      if (!service) {
        errors.push(`Service ${item.serviceId} not found`);
        continue;
      }

      // Validate quantity
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for service ${service.code}`);
      }

      // Validate price
      if (item.unitPrice <= 0) {
        errors.push(`Invalid price for service ${service.code}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async applyPaymentToInvoice(invoiceId: string, paymentAmount: number) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const newAmountPaid = invoice.amountPaid + paymentAmount;
      const newBalance = invoice.totalAmount - newAmountPaid;

      let newStatus = invoice.status;
      if (newBalance <= 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newBalance < invoice.totalAmount) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus
        }
      });

      logger.info(`Payment applied to invoice: ${invoiceId}, amount: ${paymentAmount}`);

      return updatedInvoice;
    } catch (error) {
      logger.error('Apply payment to invoice error:', error);
      throw error;
    }
  }

  async getInvoiceSummary(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          patient: { include: { user: true } },
          provider: { include: { user: true } },
          items: { include: { service: true } },
          payments: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          totalAmount: invoice.totalAmount,
          amountPaid: invoice.amountPaid,
          balance: invoice.balance,
          dueDate: invoice.dueDate,
          serviceDate: invoice.serviceDate,
          createdAt: invoice.createdAt
        },
        patient: {
          name: invoice.patient.user.name,
          email: invoice.patient.user.email
        },
        provider: {
          name: invoice.provider.user.name,
          practiceName: invoice.provider.practiceName
        },
        items: invoice.items.map(item => ({
          code: item.service.code,
          name: item.service.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount
        })),
        payments: invoice.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          processedAt: payment.processedAt
        }))
      };
    } catch (error) {
      logger.error('Get invoice summary error:', error);
      throw error;
    }
  }
}
