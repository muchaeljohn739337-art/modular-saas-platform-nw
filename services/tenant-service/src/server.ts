import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';
import pino from 'pino';

dotenv.config();

const app = express();
const logger = pino();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch((err) => {
  logger.error('Redis connection error:', err);
});

app.use(express.json());

interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = 'user-from-token';
  req.tenantId = req.headers['x-tenant-id'] as string;
  next();
};

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'tenant-service',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/tenants', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, plan } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO tenants (name, slug, description, plan, owner_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, slug, description, plan, created_at
    `;

    const result = await pool.query(query, [
      name,
      slug,
      description || null,
      plan || 'starter',
      req.userId,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tenants/:tenantId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    const cacheKey = `tenant:${tenantId}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const query = `
      SELECT id, name, slug, description, plan, owner_id, created_at, updated_at
      FROM tenants
      WHERE id = $1
    `;

    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const response = {
      success: true,
      data: result.rows[0],
    };

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tenants/:tenantId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { name, description, plan } = req.body;

    const query = `
      UPDATE tenants
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          plan = COALESCE($3, plan),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, slug, description, plan, updated_at
    `;

    const result = await pool.query(query, [name, description, plan, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await redisClient.del(`tenant:${tenantId}`);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tenants/:tenantId/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    const query = `
      SELECT u.id, u.email, u.name, tm.role, tm.joined_at
      FROM tenant_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.tenant_id = $1
      ORDER BY tm.joined_at DESC
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching tenant members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tenants/:tenantId/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO tenant_members (tenant_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING tenant_id, user_id, role, joined_at
    `;

    const result = await pool.query(query, [tenantId, userId, role]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error adding tenant member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  logger.info(`🚀 Tenant Service running on port ${PORT}`);
});

export default app;
