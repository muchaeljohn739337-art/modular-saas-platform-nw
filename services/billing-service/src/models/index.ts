export interface Subscription {
  id: string;
  tenant_id: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "cancelled" | "past_due" | "unpaid";
  current_period_start: Date;
  current_period_end: Date;
  stripe_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  due_date: Date;
  paid_at?: Date;
  stripe_invoice_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  payment_method: string;
  stripe_payment_intent_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UsageMetric {
  id: string;
  tenant_id: string;
  metric_type: "api_calls" | "storage" | "users" | "transactions";
  quantity: number;
  period_start: Date;
  period_end: Date;
  created_at: Date;
}
