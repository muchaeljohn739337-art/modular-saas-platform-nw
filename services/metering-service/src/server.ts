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
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = 'user-from-token';
  next();
};

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'metering-service',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/meters/record', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { meterId, value, unit, timestamp } = req.body;

    if (!meterId || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO usage_meters (meter_id, user_id, value, unit, recorded_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, meter_id, value, unit, recorded_at
    `;

    const result = await pool.query(query, [
      meterId,
      req.userId,
      value,
      unit || 'units',
      timestamp || new Date(),
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error recording meter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/meters/:meterId/usage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { meterId } = req.params;
    const { startDate, endDate } = req.query;

    const cacheKey = `meter:${meterId}:${startDate}:${endDate}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const query = `
      SELECT 
        meter_id,
        SUM(value) as total_usage,
        COUNT(*) as record_count,
        MIN(recorded_at) as period_start,
        MAX(recorded_at) as period_end
      FROM usage_meters
      WHERE meter_id = $1
        AND user_id = $2
        AND recorded_at >= $3
        AND recorded_at <= $4
      GROUP BY meter_id
    `;

    const result = await pool.query(query, [
      meterId,
      req.userId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date(),
    ]);

    const response = {
      success: true,
      data: result.rows[0] || { total_usage: 0, record_count: 0 },
    };

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/meters/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT 
        meter_id,
        SUM(value) as total_usage,
        AVG(value) as avg_usage,
        MAX(value) as max_usage,
        COUNT(*) as record_count
      FROM usage_meters
      WHERE user_id = $1
      GROUP BY meter_id
      ORDER BY total_usage DESC
    `;

    const result = await pool.query(query, [req.userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  logger.info(`🚀 Metering Service running on port ${PORT}`);
});

export default app;
