import winston from 'winston';

/**
 * Structured JSON logger
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  silent: process.env.NODE_ENV === 'test',
  transports: [new winston.transports.Console({ stderrLevels: ['error'] })]
});

