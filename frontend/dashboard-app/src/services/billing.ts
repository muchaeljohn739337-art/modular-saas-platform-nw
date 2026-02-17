import { apiClient } from "./index";

// Billing Service Types
export interface CreateInvoiceRequest {
  tenant_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  due_date: string;
  description: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  metadata?: Record<string, any>;
}

export interface PaymentRequest {
  invoice_id: string;
  payment_method: "credit_card" | "bank_transfer" | "crypto" | "check";
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  payment_id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  gateway_response?: any;
  created_at: string;
  processed_at?: string;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  customer_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  description: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  created_at: string;
  updated_at: string;
  due_date: string;
  paid_at?: string;
  cancelled_at?: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: string;
  billing_cycle: "monthly" | "yearly";
  status: "active" | "expired" | "trial" | "cancelled";
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  created_at: string;
  updated_at: string;
  features: string[];
  price: number;
}

export interface BillingStats {
  total_revenue: number;
  monthly_revenue: number;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  total_customers: number;
  active_subscriptions: number;
  churn_rate: number;
  mrr: number;
  arpu: number;
}

// Billing Service API Methods
export class BillingService {
  private client = apiClient;

  async createInvoice(invoiceData: CreateInvoiceRequest): Promise<ApiResponse<Invoice>> {
    return this.client.post<Invoice>("/billing/invoices", invoiceData);
  }

  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
    return this.client.get<Invoice>(`/billing/invoices/${invoiceId}`);
  }

  async updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
    return this.client.patch<Invoice>(`/billing/invoices/${invoiceId}`, invoiceData);
  }

  async deleteInvoice(invoiceId: string): Promise<ApiResponse<null>> {
    return this.client.delete<null>(`/billing/invoices/${invoiceId}`);
  }

  async listInvoices(params?: QueryParams): Promise<ApiResponse<Invoice[]>> {
    return this.client.get<Invoice[]>("/billing/invoices", params);
  }

  async getInvoiceStats(): Promise<ApiResponse<BillingStats>> {
    return this.client.get<BillingStats>("/billing/stats");
  }

  async processPayment(paymentData: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    return this.client.post<PaymentResponse>("/billing/payments", paymentData);
  }

  async getPayment(paymentId: string): Promise<ApiResponse<PaymentResponse>> {
    return this.client.get<PaymentResponse>(`/billing/payments/${paymentId}`);
  }

  async listPayments(params?: QueryParams): Promise<ApiResponse<PaymentResponse[]>> {
    return this.client.get<PaymentResponse[]>("/billing/payments", params);
  }

  async createSubscription(subscriptionData: {
    tenant_id: string;
    plan: string;
    billing_cycle: "monthly" | "yearly";
    features: string[];
  }): Promise<ApiResponse<Subscription>> {
    return this.client.post<Subscription>("/billing/subscriptions", subscriptionData);
  }

  async getSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    return this.client.get<Subscription>(`/billing/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, subscriptionData: Partial<Subscription>): Promise<ApiResponse<Subscription>> {
    return this.client.patch<Subscription>(`/billing/subscriptions/${subscriptionId}`, subscriptionData);
  }

  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    return this.client.post<Subscription>(`/billing/subscriptions/${subscriptionId}/cancel`);
  }

  async getBillingStats(): Promise<ApiResponse<BillingStats>> {
    return this.client.get<BillingStats>("/billing/stats");
  }
}

export const billingService = new BillingService();
