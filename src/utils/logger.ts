type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

const SERVICE_NAME = 'card-validator';

/**
 * Creates structured JSON log entry with timestamp and service name
 * JSON format enables easy parsing by log aggregation systems (CloudWatch, etc.)
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    ...context
  };
  return JSON.stringify(entry);
}

/**
 * Structured logger for application-wide logging
 * Uses console methods internally for stdout/stderr output
 */
export const logger = {
  info: (message: string, context?: LogContext): void => {
    console.log(createLogEntry('info', message, context));
  },
  warn: (message: string, context?: LogContext): void => {
    console.warn(createLogEntry('warn', message, context));
  },
  error: (message: string, context?: LogContext): void => {
    console.error(createLogEntry('error', message, context));
  },
  debug: (message: string, context?: LogContext): void => {
    // Debug logs only in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(createLogEntry('debug', message, context));
    }
  }
};

