import { Pool } from "pg";
import { config } from "../config/config";
import { Subscription, Invoice, Payment } from "../models";

const pool = new Pool({ connectionString: config.db.url });

export class BillingService {
  async createSubscription(tenantId: string, plan: string, paymentMethodId: string): Promise<Subscription> {
    const { rows } = await pool.query(
      `INSERT INTO subscriptions (tenant_id, plan, status, current_period_start, current_period_end)
       VALUES ($1, $2, "active", NOW(), NOW() + INTERVAL "1 month")
       RETURNING *`,
      [tenantId, plan]
    );

    const subscription = rows[0];

    // TODO: Create Stripe subscription
    // const stripeSubscription = await stripe.subscriptions.create({
    //   customer: tenantId,
    //   items: [{ price: planPriceId }],
    //   payment_method: paymentMethodId,
    // });

    return subscription;
  }

  async getSubscription(tenantId: string): Promise<Subscription | null> {
    const { rows } = await pool.query(
      "SELECT * FROM subscriptions WHERE tenant_id = $1 AND status != \"cancelled\" ORDER BY created_at DESC LIMIT 1",
      [tenantId]
    );
    return rows[0] || null;
  }

  async updateSubscription(subscriptionId: string, plan: string): Promise<Subscription> {
    const { rows } = await pool.query(
      `UPDATE subscriptions 
       SET plan = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [subscriptionId, plan]
    );

    return rows[0];
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const { rows } = await pool.query(
      `UPDATE subscriptions 
       SET status = "cancelled", updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [subscriptionId]
    );

    return rows[0];
  }

  async createInvoice(tenantId: string, subscriptionId: string, amount: number): Promise<Invoice> {
    const { rows } = await pool.query(
      `INSERT INTO invoices (tenant_id, subscription_id, amount, currency, status, due_date)
       VALUES ($1, $2, $3, "usd", "open", NOW() + INTERVAL "7 days")
       RETURNING *`,
      [tenantId, subscriptionId, amount]
    );

    return rows[0];
  }

  async getInvoices(tenantId: string): Promise<Invoice[]> {
    const { rows } = await pool.query(
      "SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC",
      [tenantId]
    );
    return rows;
  }

  async processPayment(invoiceId: string, paymentMethodId: string): Promise<Payment> {
    const { rows } = await pool.query(
      `INSERT INTO payments (tenant_id, invoice_id, amount, currency, status, payment_method)
       SELECT tenant_id, id, amount, currency, "pending", $2
       FROM invoices WHERE id = $1
       RETURNING *`,
      [invoiceId, paymentMethodId]
    );

    const payment = rows[0];

    // TODO: Process Stripe payment
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: payment.amount * 100, // Convert to cents
    //   currency: payment.currency,
    //   payment_method: paymentMethodId,
    //   confirm: true,
    // });

    return payment;
  }

  async recordUsage(tenantId: string, metricType: string, quantity: number): Promise<void> {
    await pool.query(
      `INSERT INTO usage_metrics (tenant_id, metric_type, quantity, period_start, period_end)
       VALUES ($1, $2, $3, DATE_TRUNC("month", NOW()), DATE_TRUNC("month", NOW()) + INTERVAL "1 month")
       ON CONFLICT (tenant_id, metric_type, period_start)
       DO UPDATE SET quantity = usage_metrics.quantity + $3`,
      [tenantId, metricType, quantity]
    );
  }

  async getUsageMetrics(tenantId: string, periodStart: Date, periodEnd: Date): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT metric_type, quantity, period_start, period_end
       FROM usage_metrics
       WHERE tenant_id = $1 AND period_start >= $2 AND period_end <= $3
       ORDER BY period_start DESC`,
      [tenantId, periodStart, periodEnd]
    );
    return rows;
  }
}
