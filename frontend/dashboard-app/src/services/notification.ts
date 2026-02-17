import { apiClient } from "./index";

// Notification Service Types
export interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "webhook" | "slack" | "teams" | "discord";
  subject: string;
  body: string;
  html_template?: string;
  variables: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRequest {
  tenant_id?: string;
  user_id?: string;
  recipient: string;
  type: string;
  subject: string;
  message: string;
  data?: any;
  template_id?: string;
  variables?: Record<string, any>;
  scheduled_at?: string;
  priority: "low" | "medium" | "high" | "critical";
  metadata: Record<string, any>;
}

export interface Notification {
  id: string;
  tenant_id?: string;
  user_id?: string;
  recipient: string;
  type: string;
  subject: string;
  message: string;
  status: "pending" | "sent" | "delivered" | "failed" | "cancelled";
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
}

export interface NotificationStats {
  total_notifications: number;
  sent_notifications: number;
  delivered_notifications: number;
  failed_notifications: number;
  delivery_rate: number;
  notifications_by_type: Record<string, number>;
  avg_delivery_time: number;
  last_notification: string;
}

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Notification Service API Methods
export class NotificationService {
  private client = apiClient;

  async sendNotification(notificationData: NotificationRequest): Promise<Notification>> {
    return this.client.post<Notification>("/notifications/send", notificationData);
  }

  async getNotification(notificationId: string): Promise<Notification>> {
    return this.client.get<Notification>(`/notifications/${notificationId}`);
  }

  async listNotifications(params?: QueryParams): Promise<Notification[]>> {
    return this.client.get<Notification[]>("/notifications", params);
  }

  async updateNotification(notificationId: string, notificationData: Partial<Notification>): Promise<Notification>> {
    return this.client.patch<Notification>(`/notifications/${notificationId}`, notificationData);
  }

  async deleteNotification(notificationId: string): Promise<Notification>> {
    return this.client.delete<Notification>(`/notifications/${notificationId}`);
  }

  async markAsRead(notificationId: string): Promise<Notification>> {
    return this.client.post<Notification>(`/notifications/${notificationId}/read`);
  async resendNotification(notificationId: string): Promise<Notification>> {
    return this.client.post<Notification>(`/notifications/${notificationId}/resend`);
  }

  async createTemplate(templateData: {
    name: string;
    type: string;
    subject: string;
    body: string;
    html_template?: string;
    variables: Record<string, any>;
    enabled: boolean;
  }): Promise<NotificationTemplate>> {
    return this.client.post<NotificationTemplate>("/notifications/templates", templateData);
  }

  async listTemplates(params?: QueryParams): Promise<NotificationTemplate[]>> {
    return this.client.get<NotificationTemplate[]>("/notifications/templates", params);
  async getTemplate(templateId: string): Promise<NotificationTemplate>> {
    return this.client.get<NotificationTemplate>(`/notifications/templates/${templateId}`);
  }

  async updateTemplate(templateId: string, templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate>> {
    return this.client.patch<NotificationTemplate>(`/notifications/templates/${templateId}`, templateData);
  async deleteTemplate(templateId: string): Promise<NotificationTemplate>> {
    return this.client.delete<NotificationTemplate>(`/notifications/templates/${templateId}`);
  }

  async listChannels(params?: QueryParams): Promise<NotificationChannel[]>> {
    return this.client.get<NotificationChannel[]>("/notifications/channels", params);
  }

  async getChannel(channelId: string): Promise<NotificationChannel>> {
    return this.client.get<NotificationChannel>(`/notifications/channels/${channelId}`);
  }

  async createChannel(channelData: {
    name: string;
    type: string;
    config: Record<string, any>;
    enabled: boolean;
  }): Promise<NotificationChannel>> {
    return this.client.post<NotificationChannel>("/notifications/channels", channelData);
  }

  async updateChannel(channelId: string, channelData: Partial<NotificationChannel>): Promise<NotificationChannel>> {
    return this.client.patch<NotificationChannel>(`/notifications/channels/${channelId}`, channelData);
  async deleteChannel(channelId: string): Promise<NotificationChannel>> {
    return this.client.delete<NotificationChannel>(`/notifications/channels/${channelId}`);
  }

  async getNotificationStats(): Promise<NotificationStats>> {
    return this.client.get<NotificationStats>("/notifications/stats");
  }

  async sendWebhook(webhookData: WebhookPayload): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return this.client.post<ApiResponse<{ success: boolean; message: string }>>("/notifications/webhook", webhookData);
  }
}

export const notificationService = new NotificationService();
