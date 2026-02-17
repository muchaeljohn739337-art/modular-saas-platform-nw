import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

export interface Event {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  (event: Event): Promise<void>;
}

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private redis: Redis;
  private serviceName: string;

  constructor(redis: Redis, serviceName: string = 'advancia-backend') {
    this.redis = redis;
    this.serviceName = serviceName;
    this.setupRedisSubscriber();
  }

  private setupRedisSubscriber(): void {
    const subscriber = new Redis(process.env.REDIS_URL!);
    
    subscriber.subscribe('events', (err, count) => {
      if (err) {
        logger.error('Redis subscription error:', err);
        return;
      }
      
      logger.info(`Subscribed to ${count} channels`);
    });

    subscriber.on('message', async (channel, message) => {
      if (channel === 'events') {
        try {
          const event: Event = JSON.parse(message);
          await this.handleEvent(event);
        } catch (error) {
          logger.error('Error processing Redis event:', error);
        }
      }
    });
  }

  async emit(eventType: string, data: any, options?: {
    userId?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const event: Event = {
      id: this.generateEventId(),
      type: eventType,
      data,
      timestamp: new Date(),
      userId: options?.userId,
      tenantId: options?.tenantId,
      metadata: options?.metadata
    };

    // Store event in Redis for persistence
    await this.storeEvent(event);

    // Publish to Redis for other services
    await this.redis.publish('events', JSON.stringify(event));

    // Handle locally
    await this.handleEvent(event);

    logger.debug(`Event emitted: ${eventType}`, { eventId: event.id });
  }

  async on(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    logger.debug(`Handler registered for event: ${eventType}`);
  }

  async off(eventType: string, handler: EventHandler): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        logger.debug(`Handler removed for event: ${eventType}`);
      }
    }
  }

  private async handleEvent(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    if (handlers.length === 0) {
      logger.debug(`No handlers for event: ${event.type}`);
      return;
    }

    // Execute all handlers concurrently
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}:`, error);
        // Continue processing other handlers even if one fails
      }
    });

    await Promise.allSettled(promises);
    
    logger.debug(`Event processed: ${event.type}`, { 
      eventId: event.id, 
      handlersCount: handlers.length 
    });
  }

  private async storeEvent(event: Event): Promise<void> {
    const key = `event:${event.id}`;
    const value = JSON.stringify(event);
    
    // Store event for 7 days
    await this.redis.setex(key, 7 * 24 * 60 * 60, value);
    
    // Add to event type index for querying
    const typeKey = `events:${event.type}`;
    await this.redis.lpush(typeKey, event.id);
    await this.redis.expire(typeKey, 7 * 24 * 60 * 60);
    
    // Add to user events index if userId is present
    if (event.userId) {
      const userKey = `user_events:${event.userId}`;
      await this.redis.lpush(userKey, event.id);
      await this.redis.expire(userKey, 7 * 24 * 60 * 60);
    }
    
    // Add to tenant events index if tenantId is present
    if (event.tenantId) {
      const tenantKey = `tenant_events:${event.tenantId}`;
      await this.redis.lpush(tenantKey, event.id);
      await this.redis.expire(tenantKey, 7 * 24 * 60 * 60);
    }
  }

  async getEvents(eventType: string, limit: number = 100): Promise<Event[]> {
    const typeKey = `events:${eventType}`;
    const eventIds = await this.redis.lrange(typeKey, 0, limit - 1);
    
    if (eventIds.length === 0) {
      return [];
    }
    
    const promises = eventIds.map(async (id) => {
      const key = `event:${id}`;
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    });
    
    const events = await Promise.all(promises);
    return events.filter(event => event !== null);
  }

  async getUserEvents(userId: string, limit: number = 100): Promise<Event[]> {
    const userKey = `user_events:${userId}`;
    const eventIds = await this.redis.lrange(userKey, 0, limit - 1);
    
    if (eventIds.length === 0) {
      return [];
    }
    
    const promises = eventIds.map(async (id) => {
      const key = `event:${id}`;
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    });
    
    const events = await Promise.all(promises);
    return events.filter(event => event !== null);
  }

  async getTenantEvents(tenantId: string, limit: number = 100): Promise<Event[]> {
    const tenantKey = `tenant_events:${tenantId}`;
    const eventIds = await this.redis.lrange(tenantKey, 0, limit - 1);
    
    if (eventIds.length === 0) {
      return [];
    }
    
    const promises = eventIds.map(async (id) => {
      const key = `event:${id}`;
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    });
    
    const events = await Promise.all(promises);
    return events.filter(event => event !== null);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Event bus health check failed:', error);
      return false;
    }
  }

  private generateEventId(): string {
    return `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods for common event types
  async emitUserEvent(action: string, userId: string, data?: any): Promise<void> {
    await this.emit(`user.${action}`, data, { userId });
  }

  async emitTenantEvent(action: string, tenantId: string, data?: any): Promise<void> {
    await this.emit(`tenant.${action}`, data, { tenantId });
  }

  async emitSecurityEvent(action: string, data?: any): Promise<void> {
    await this.emit(`security.${action}`, data, { metadata: { priority: 'high' } });
  }

  async emitSystemEvent(action: string, data?: any): Promise<void> {
    await this.emit(`system.${action}`, data);
  }
}

// Singleton instance
export let eventBus: EventBus;

export const initializeEventBus = (redis: Redis, serviceName?: string): EventBus => {
  eventBus = new EventBus(redis, serviceName);
  return eventBus;
};
