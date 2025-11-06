import winston from 'winston';

/**
 * Winston logger configured for structured JSON logging
 * JSON format enables easy parsing by log aggregation systems (CloudWatch, etc.)
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
});

