import express, { Express } from 'express';
import { healthRoute } from './routes/health';
import { validateRoute } from './routes/validate';
import { logger } from './utils/logger';

const app: Express = express();
app.use(express.json());

app.post('/validate', validateRoute);
app.get('/health', healthRoute);

app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Not Found' });
});

export { app };

if (require.main === module) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
  }).on('error', (err: NodeJS.ErrnoException) => {
    logger.error('Server failed to start', { error: err.message });
    process.exit(1);
  });
}
