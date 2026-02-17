import { Request, Response, NextFunction } from "express";
import { BillingService } from "../services/billing.service";

const billingService = new BillingService();

export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, plan, paymentMethodId } = req.body;
    const subscription = await billingService.createSubscription(tenantId, plan, paymentMethodId);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const subscription = await billingService.getSubscription(tenantId);
    
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    
    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId } = req.params;
    const { plan } = req.body;
    const subscription = await billingService.updateSubscription(subscriptionId, plan);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await billingService.cancelSubscription(subscriptionId);
    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const invoices = await billingService.getInvoices(tenantId);
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, subscriptionId, amount } = req.body;
    const invoice = await billingService.createInvoice(tenantId, subscriptionId, amount);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethodId } = req.body;
    const payment = await billingService.processPayment(invoiceId, paymentMethodId);
    res.json(payment);
  } catch (error) {
    next(error);
  }
};

export const recordUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, metricType, quantity } = req.body;
    await billingService.recordUsage(tenantId, metricType, quantity);
    res.json({ message: "Usage recorded successfully" });
  } catch (error) {
    next(error);
  }
};

export const getUsageMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const { periodStart, periodEnd } = req.query;
    
    const metrics = await billingService.getUsageMetrics(
      tenantId,
      new Date(periodStart as string),
      new Date(periodEnd as string)
    );
    
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};
