import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class PDFService {
  async generateInvoicePDF(invoice: any): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Invoice header
      page.drawText('INVOICE', {
        x: 50,
        y: 720,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(`#${invoice.invoiceNumber}`, {
        x: 50,
        y: 690,
        size: 16,
        font: font,
        color: rgb(0, 0, 0)
      });

      // Date information
      page.drawText(`Invoice Date: ${invoice.createdAt.toLocaleDateString()}`, {
        x: 50,
        y: 660,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, {
        x: 50,
        y: 640,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Service Date: ${invoice.serviceDate.toLocaleDateString()}`, {
        x: 50,
        y: 620,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      // Provider information
      page.drawText('BILL FROM:', {
        x: 350,
        y: 690,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(invoice.provider.user.name, {
        x: 350,
        y: 670,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      if (invoice.provider.practiceName) {
        page.drawText(invoice.provider.practiceName, {
          x: 350,
          y: 650,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        });
      }

      // Patient information
      page.drawText('BILL TO:', {
        x: 50,
        y: 570,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(invoice.patient.user.name, {
        x: 50,
        y: 550,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(invoice.patient.user.email, {
        x: 50,
        y: 530,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      // Table headers
      let yPosition = 480;
      
      page.drawText('SERVICE CODE', {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('DESCRIPTION', {
        x: 150,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('QTY', {
        x: 350,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('UNIT PRICE', {
        x: 400,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('TOTAL', {
        x: 500,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      // Line under headers
      page.drawLine({
        start: { x: 50, y: yPosition - 5 },
        end: { x: 550, y: yPosition - 5 },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      // Invoice items
      yPosition -= 25;
      
      for (const item of invoice.items) {
        page.drawText(item.service.code, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(item.service.name.substring(0, 30), {
          x: 150,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(item.quantity.toString(), {
          x: 350,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(`$${item.unitPrice.toFixed(2)}`, {
          x: 400,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(`$${item.totalAmount.toFixed(2)}`, {
          x: 500,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        yPosition -= 20;

        // Add description if available
        if (item.description && item.description.length > 0) {
          page.drawText(item.description.substring(0, 40), {
            x: 150,
            y: yPosition,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.5)
          });
          yPosition -= 15;
        }

        // Check if we need a new page
        if (yPosition < 200) {
          break;
        }
      }

      // Total section
      yPosition -= 30;
      
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 550, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      yPosition -= 25;

      page.drawText('Subtotal:', {
        x: 400,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(`$${invoice.totalAmount.toFixed(2)}`, {
        x: 500,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      yPosition -= 20;

      page.drawText('Paid:', {
        x: 400,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(`$${invoice.amountPaid.toFixed(2)}`, {
        x: 500,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      yPosition -= 20;

      page.drawText('Balance Due:', {
        x: 400,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(`$${invoice.balance.toFixed(2)}`, {
        x: 500,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      // Footer
      yPosition = 100;
      
      page.drawText('Payment Terms: Due upon receipt', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });

      yPosition -= 20;

      page.drawText('Thank you for your business!', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });

      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();
      
      logger.info(`PDF generated for invoice: ${invoice.invoiceNumber}`);
      
      return Buffer.from(pdfBytes);
    } catch (error) {
      logger.error('Generate PDF error:', error);
      throw error;
    }
  }

  async generateStatementPDF(patientId: string, startDate: Date, endDate: Date): Promise<Buffer> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true }
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      const invoices = await prisma.invoice.findMany({
        where: {
          patientId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: { include: { service: true } },
          payments: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Statement header
      page.drawText('STATEMENT', {
        x: 50,
        y: 720,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, {
        x: 50,
        y: 690,
        size: 14,
        font: font,
        color: rgb(0, 0, 0)
      });

      // Patient information
      page.drawText('PATIENT:', {
        x: 50,
        y: 650,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(patient.user.name, {
        x: 50,
        y: 630,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(patient.user.email, {
        x: 50,
        y: 610,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      // Calculate totals
      const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const totalPaid = invoices.reduce((sum, invoice) => 
        sum + invoice.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
      );
      const totalBalance = totalBilled - totalPaid;

      // Summary
      page.drawText('SUMMARY:', {
        x: 350,
        y: 650,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Total Billed: $${totalBilled.toFixed(2)}`, {
        x: 350,
        y: 630,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Total Paid: $${totalPaid.toFixed(2)}`, {
        x: 350,
        y: 610,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Balance Due: $${totalBalance.toFixed(2)}`, {
        x: 350,
        y: 590,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      // Invoice list
      let yPosition = 540;
      
      page.drawText('INVOICE #', {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('DATE', {
        x: 150,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('AMOUNT', {
        x: 250,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('PAID', {
        x: 350,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText('BALANCE', {
        x: 450,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      // Line under headers
      page.drawLine({
        start: { x: 50, y: yPosition - 5 },
        end: { x: 550, y: yPosition - 5 },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      yPosition -= 25;

      for (const invoice of invoices) {
        page.drawText(invoice.invoiceNumber, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(invoice.createdAt.toLocaleDateString(), {
          x: 150,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(`$${invoice.totalAmount.toFixed(2)}`, {
          x: 250,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(`$${invoice.amountPaid.toFixed(2)}`, {
          x: 350,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        page.drawText(`$${invoice.balance.toFixed(2)}`, {
          x: 450,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0)
        });

        yPosition -= 20;

        if (yPosition < 150) {
          break;
        }
      }

      // Footer
      yPosition = 100;
      
      page.drawText('Please remit payment to the address above.', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });

      const pdfBytes = await pdfDoc.save();
      
      logger.info(`Statement PDF generated for patient: ${patientId}`);
      
      return Buffer.from(pdfBytes);
    } catch (error) {
      logger.error('Generate statement PDF error:', error);
      throw error;
    }
  }
}
