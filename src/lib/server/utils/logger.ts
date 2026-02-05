/**
 * Simple structured logger for server-side code
 *
 * In production, consider replacing with a proper logging service
 * (e.g., Pino, Winston, or a cloud logging service like Datadog/Sentry)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to 'info' in production, 'debug' in development
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Logger with structured context support
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message, context));
    }
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    if (shouldLog("error")) {
      const errorContext: LogContext = { ...context };

      if (error instanceof Error) {
        errorContext.errorMessage = error.message;
        errorContext.errorStack = error.stack;
      } else if (error !== undefined) {
        errorContext.error = String(error);
      }

      console.error(formatMessage("error", message, errorContext));
    }
  },
};

/**
 * Create a child logger with a fixed prefix/context
 */
export function createLogger(prefix: string) {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(`[${prefix}] ${message}`, context);
    },
    info(message: string, context?: LogContext): void {
      logger.info(`[${prefix}] ${message}`, context);
    },
    warn(message: string, context?: LogContext): void {
      logger.warn(`[${prefix}] ${message}`, context);
    },
    error(message: string, error?: unknown, context?: LogContext): void {
      logger.error(`[${prefix}] ${message}`, error, context);
    },
  };
}
