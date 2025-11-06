import express, { Express } from 'express';
import { getEnvironmentConfig } from '../bin/env';
import { healthRoute } from './routes/health';
import { validateRoute } from './routes/validate';
import { logger } from './utils/logger';

const app: Express = express();
app.use(express.json());

// Routes
app.post('/validate', validateRoute);
app.get('/health', healthRoute);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Not Found' });
});

export { app };

// Start server if executed directly
if (require.main === module) {
  const { port } = getEnvironmentConfig();
  app.listen(port, () => {
    logger.info('Server started', { port });
  }).on('error', (err: NodeJS.ErrnoException) => {
    logger.error('Server failed to start', { error: err.message });
    process.exit(1);
  });
}
