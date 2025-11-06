import express, { Express } from 'express';
import { healthRoute } from './routes/health';
import { validateRoute } from './routes/validate';
import { logger } from './utils/logger';

/**
 * Express application setup
 * JSON body parsing enabled for POST /validate endpoint
 */
const app: Express = express();
app.use(express.json());

/**
 * API Routes
 * POST /validate - Validates credit card number using Luhn algorithm
 * GET  /health   - Health check endpoint
 */
app.post('/validate', validateRoute);
app.get('/health', healthRoute);

export { app };

/**
 * Get port from environment or default to 3000
 */
function getPort(): number {
  const portEnv = process.env.PORT;
  return portEnv ? parseInt(portEnv, 10) : 3000;
}

/**
 * Validate port is within valid TCP range (1-65535)
 * Exits with error if invalid to prevent silent failures
 */
function validatePort(port: number, portEnv: string | undefined): void {
  if (isNaN(port) || port < 1 || port > 65535) {
    logger.error('Invalid PORT value', { 
      provided: portEnv, 
      hint: 'PORT must be a number between 1 and 65535.' 
    });
    process.exit(1);
  }
}

/**
 * Handle server startup errors
 * Common case: port already in use (helpful error message)
 */
function handleServerError(err: NodeJS.ErrnoException, port: number): void {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${port} is already in use`, {
      port,
      hint: 'Use PORT environment variable or stop the process using this port'
    });
  } else {
    logger.error('Server failed to start', { error: err.message });
  }
  process.exit(1);
}

/**
 * Start HTTP server
 * Called only when run directly (not when imported by tests)
 */
function startServer(): void {
  const PORT = getPort();
  validatePort(PORT, process.env.PORT);
  
  app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
  }).on('error', (err: NodeJS.ErrnoException) => {
    handleServerError(err, PORT);
  });
}

// Only start server when run directly (not imported as module by tests)
if (require.main === module) {
  startServer();
}

