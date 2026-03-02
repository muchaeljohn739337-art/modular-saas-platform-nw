import { Request, Response } from 'express';
import { PrismaClient, InvoiceStatus, PaymentStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { AuditService } from '../services/auditService';
import { InvoiceService } from '../services/invoiceService';
import { PDFService } from '../services/pdfService';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();
const auditService = new AuditService();
const invoiceService = new InvoiceService();
const pdfService = new PDFService();
const notificationService = new NotificationService();

export class BillingController {
  async createInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { patientId, providerId, items, dueDate, serviceDate } = req.body;

      // Validate patient and provider exist
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true }
      });

      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: { user: true }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      // Get or create patient account
      let account = await prisma.account.findFirst({
        where: { userId: patient.userId }
      });

      if (!account) {
        account = await prisma.account.create({
          data: {
            userId: patient.userId,
            accountNumber: `ACC${Date.now()}`,
            accountType: 'CHECKING'
          }
        });
      }

      // Calculate total amount
      let totalAmount = 0;
      const invoiceItems = [];

      for (const item of items) {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId }
        });

        if (!service) {
          return res.status(404).json({ error: `Service ${item.serviceId} not found` });
        }

        const itemTotal = item.quantity * item.unitPrice;
        totalAmount += itemTotal;

        invoiceItems.push({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: itemTotal,
          description: item.description || service.name
        });
      }

      // Generate invoice number
      const invoiceNumber = `INV${Date.now()}`;

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId,
          providerId,
          accountId: account.id,
          totalAmount,
          balance: totalAmount,
          dueDate: new Date(dueDate),
          serviceDate: new Date(serviceDate),
          status: InvoiceStatus.DRAFT,
          items: {
            create: invoiceItems
          }
        },
        include: {
          patient: {
            include: { user: true }
          },
          provider: {
            include: { user: true }
          },
          items: {
            include: { service: true }
          }
        }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'INVOICE_CREATE',
        resource: 'Invoice',
        resourceId: invoice.id,
        newValues: {
          invoiceNumber,
          patientId,
          providerId,
          totalAmount,
          itemCount: items.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Invoice created: ${invoiceNumber}`);

      res.status(201).json({
        message: 'Invoice created successfully',
        invoice
      });
    } catch (error) {
      logger.error('Create invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getInvoices(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        patientId,
        providerId,
        startDate,
        endDate
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) where.status = status;
      if (patientId) where.patientId = patientId;
      if (providerId) where.providerId = providerId;
      if (startDate || endDate) {
        where.serviceDate = {};
        if (startDate) where.serviceDate.gte = new Date(startDate as string);
        if (endDate) where.serviceDate.lte = new Date(endDate as string);
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              include: { user: { select: { name: true, email: true } } }
            },
            provider: {
              include: { user: { select: { name: true, email: true } } }
            },
            items: {
              include: { service: true }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true
              }
            }
          }
        }),
        prisma.invoice.count({ where })
      ]);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get invoices error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: {
            include: { user: true }
          },
          provider: {
            include: { user: true }
          },
          items: {
            include: { service: true }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          },
          claims: true
        }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({ invoice });
    } catch (error) {
      logger.error('Get invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const { status, dueDate } = req.body;

      const invoice = await prisma.invoice.findUnique({
        where: { id }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (dueDate) updateData.dueDate = new Date(dueDate);

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          patient: { include: { user: true } },
          provider: { include: { user: true } },
          items: { include: { service: true } }
        }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'INVOICE_UPDATE',
        resource: 'Invoice',
        resourceId: invoice.id,
        oldValues: { status: invoice.status, dueDate: invoice.dueDate },
        newValues: updateData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Invoice updated: ${invoice.invoiceNumber}`);

      res.json({
        message: 'Invoice updated successfully',
        invoice: updatedInvoice
      });
    } catch (error) {
      logger.error('Update invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { payments: true }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Check if invoice has payments
      if (invoice.payments.length > 0) {
        return res.status(400).json({ error: 'Cannot delete invoice with payments' });
      }

      await prisma.invoice.delete({
        where: { id }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'INVOICE_DELETE',
        resource: 'Invoice',
        resourceId: invoice.id,
        oldValues: { invoiceNumber: invoice.invoiceNumber },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Invoice deleted: ${invoice.invoiceNumber}`);

      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      logger.error('Delete invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async sendInvoice(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          patient: { include: { user: true } },
          provider: { include: { user: true } },
          items: { include: { service: true } }
        }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Generate PDF
      const pdfBuffer = await pdfService.generateInvoicePDF(invoice);

      // Send notification
      await notificationService.sendInvoiceNotification(invoice.patient.user.email, invoice, pdfBuffer);

      // Update invoice status
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.SENT }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'INVOICE_SEND',
        resource: 'Invoice',
        resourceId: invoice.id,
        newValues: { status: 'SENT' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Invoice sent: ${invoice.invoiceNumber}`);

      res.json({
        message: 'Invoice sent successfully',
        invoice: updatedInvoice
      });
    } catch (error) {
      logger.error('Send invoice error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addInvoiceItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const { serviceId, quantity, unitPrice, description } = req.body;

      const invoice = await prisma.invoice.findUnique({
        where: { id }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (invoice.status !== InvoiceStatus.DRAFT) {
        return res.status(400).json({ error: 'Cannot add items to non-draft invoice' });
      }

      const totalAmount = quantity * unitPrice;

      const invoiceItem = await prisma.invoiceItem.create({
        data: {
          invoiceId: id,
          serviceId,
          quantity,
          unitPrice,
          totalAmount,
          description
        },
        include: { service: true }
      });

      // Update invoice total
      const updatedInvoice = await invoiceService.recalculateInvoiceTotal(id);

      // Log audit
      await auditService.log({
        userId,
        action: 'INVOICE_ITEM_ADD',
        resource: 'InvoiceItem',
        resourceId: invoiceItem.id,
        newValues: { serviceId, quantity, unitPrice, totalAmount },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        message: 'Item added successfully',
        item: invoiceItem,
        invoice: updatedInvoice
      });
    } catch (error) {
      logger.error('Add invoice item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeInvoiceItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id, itemId } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (invoice.status !== InvoiceStatus.DRAFT) {
        return res.status(400).json({ error: 'Cannot remove items from non-draft invoice' });
      }

      const invoiceItem = await prisma.invoiceItem.findUnique({
        where: { id: itemId }
      });

      if (!invoiceItem) {
        return res.status(404).json({ error: 'Invoice item not found' });
      }

      await prisma.invoiceItem.delete({
        where: { id: itemId }
      });

      // Update invoice total
      const updatedInvoice = await invoiceService.recalculateInvoiceTotal(id);

      // Log audit
      await auditService.log({
        userId,
        action: 'INVOICE_ITEM_REMOVE',
        resource: 'InvoiceItem',
        resourceId: invoiceItem.id,
        oldValues: { serviceId: invoiceItem.serviceId, quantity: invoiceItem.quantity },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        message: 'Item removed successfully',
        invoice: updatedInvoice
      });
    } catch (error) {
      logger.error('Remove invoice item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getServices(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, category, providerId } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { isActive: true };

      if (category) where.category = category;
      if (providerId) where.providerId = providerId;

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            provider: {
              include: { user: { select: { name: true } } }
            }
          }
        }),
        prisma.service.count({ where })
      ]);

      res.json({
        services,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get services error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createService(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { code, name, description, category, price, providerId } = req.body;

      const service = await prisma.service.create({
        data: {
          code,
          name,
          description,
          category,
          price,
          providerId
        },
        include: {
          provider: {
            include: { user: { select: { name: true } } }
          }
        }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'SERVICE_CREATE',
        resource: 'Service',
        resourceId: service.id,
        newValues: { code, name, category, price },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`Service created: ${code} - ${name}`);

      res.status(201).json({
        message: 'Service created successfully',
        service
      });
    } catch (error) {
      logger.error('Create service error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateService(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      const { name, description, category, price, isActive } = req.body;

      const service = await prisma.service.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(price !== undefined && { price }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          provider: {
            include: { user: { select: { name: true } } }
          }
        }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'SERVICE_UPDATE',
        resource: 'Service',
        resourceId: service.id,
        newValues: { name, description, category, price, isActive },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        message: 'Service updated successfully',
        service
      });
    } catch (error) {
      logger.error('Update service error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteService(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      // Soft delete by setting isActive to false
      await prisma.service.update({
        where: { id },
        data: { isActive: false }
      });

      // Log audit
      await auditService.log({
        userId,
        action: 'SERVICE_DELETE',
        resource: 'Service',
        resourceId: id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      logger.error('Delete service error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRevenueReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, providerId } = req.query;

      const where: any = {};
      if (startDate || endDate) {
        where.serviceDate = {};
        if (startDate) where.serviceDate.gte = new Date(startDate as string);
        if (endDate) where.serviceDate.lte = new Date(endDate as string);
      }
      if (providerId) where.providerId = providerId;

      const revenueData = await prisma.invoice.groupBy({
        by: ['status'],
        where,
        _sum: {
          totalAmount: true,
          amountPaid: true
        },
        _count: {
          id: true
        }
      });

      const totalRevenue = revenueData.reduce((sum, item) => sum + (item._sum.amountPaid || 0), 0);
      const totalBilled = revenueData.reduce((sum, item) => sum + (item._sum.totalAmount || 0), 0);
      const totalInvoices = revenueData.reduce((sum, item) => sum + item._count.id, 0);

      res.json({
        period: { startDate, endDate },
        summary: {
          totalRevenue,
          totalBilled,
          totalInvoices,
          outstandingBalance: totalBilled - totalRevenue
        },
        breakdown: revenueData
      });
    } catch (error) {
      logger.error('Get revenue report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAgingReport(req: Request, res: Response) {
    try {
      const agingBuckets = [
        { name: 'Current', days: 0 },
        { name: '1-30 Days', days: 1 },
        { name: '31-60 Days', days: 31 },
        { name: '61-90 Days', days: 61 },
        { name: '90+ Days', days: 91 }
      ];

      const agingData = await Promise.all(
        agingBuckets.map(async (bucket) => {
          const where: any = {
            status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
            balance: { gt: 0 }
          };

          if (bucket.days === 0) {
            where.dueDate = { gte: new Date() };
          } else if (bucket.days === 1) {
            where.dueDate = {
              lt: new Date(),
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            };
          } else if (bucket.days === 31) {
            where.dueDate = {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            };
          } else if (bucket.days === 61) {
            where.dueDate = {
              lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            };
          } else {
            where.dueDate = { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
          }

          const [sum, count] = await Promise.all([
            prisma.invoice.aggregate({
              where,
              _sum: { balance: true }
            }),
            prisma.invoice.count({ where })
          ]);

          return {
            bucket: bucket.name,
            amount: sum._sum.balance || 0,
            count
          };
        })
      );

      res.json({
        agingReport: agingData,
        totalOutstanding: agingData.reduce((sum, item) => sum + item.amount, 0)
      });
    } catch (error) {
      logger.error('Get aging report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUnpaidInvoices(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, providerId } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        balance: { gt: 0 }
      };

      if (providerId) where.providerId = providerId;

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { dueDate: 'asc' },
          include: {
            patient: {
              include: { user: { select: { name: true, email: true } } }
            },
            provider: {
              include: { user: { select: { name: true } } }
            }
          }
        }),
        prisma.invoice.count({ where })
      ]);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get unpaid invoices error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatientInvoices(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { patientId };

      if (status) where.status = status;

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            provider: {
              include: { user: { select: { name: true } } }
            },
            items: {
              include: { service: true }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true
              }
            }
          }
        }),
        prisma.invoice.count({ where })
      ]);

      res.json({
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Get patient invoices error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatientBalance(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: true,
          invoices: {
            where: {
              status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] }
            },
            include: {
              payments: {
                where: { status: PaymentStatus.COMPLETED }
              }
            }
          }
        }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const totalBilled = patient.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const totalPaid = patient.invoices.reduce((sum, invoice) => 
        sum + invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
      );
      const outstandingBalance = totalBilled - totalPaid;

      res.json({
        patient: {
          id: patient.id,
          name: patient.user.name,
          email: patient.user.email
        },
        balance: {
          totalBilled,
          totalPaid,
          outstandingBalance,
          invoiceCount: patient.invoices.length
        }
      });
    } catch (error) {
      logger.error('Get patient balance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
