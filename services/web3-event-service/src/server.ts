import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';
import pino from 'pino';
import cron from 'node-cron';

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
    service: 'web3-event-service',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/events/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contractAddress, eventName, chainId, webhookUrl } = req.body;

    if (!contractAddress || !eventName || !chainId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO web3_event_listeners (contract_address, event_name, chain_id, webhook_url, user_id, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id, contract_address, event_name, chain_id, webhook_url, is_active, created_at
    `;

    const result = await pool.query(query, [
      contractAddress,
      eventName,
      chainId,
      webhookUrl || null,
      req.userId,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error registering event listener:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/listeners', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT id, contract_address, event_name, chain_id, webhook_url, is_active, created_at
      FROM web3_event_listeners
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [req.userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching listeners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events/process', async (req: Request, res: Response) => {
  try {
    const { eventId, transactionHash, blockNumber, eventData } = req.body;

    if (!eventId || !transactionHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO web3_events (listener_id, transaction_hash, block_number, event_data, processed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, listener_id, transaction_hash, block_number, processed_at
    `;

    const result = await pool.query(query, [
      eventId,
      transactionHash,
      blockNumber || null,
      JSON.stringify(eventData) || null,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error processing event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/:listenerId/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { listenerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT id, listener_id, transaction_hash, block_number, event_data, processed_at
      FROM web3_events
      WHERE listener_id = $1
      ORDER BY processed_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [listenerId, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    logger.error('Error fetching event history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('Running event sync job');
    const query = `
      SELECT id, webhook_url FROM web3_event_listeners
      WHERE is_active = true AND webhook_url IS NOT NULL
    `;
    const result = await pool.query(query);
    logger.info(`Found ${result.rows.length} active listeners`);
  } catch (error) {
    logger.error('Error in event sync job:', error);
  }
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  logger.info(`🚀 Web3 Event Service running on port ${PORT}`);
});

export default app;
