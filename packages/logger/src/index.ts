type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(defaultContext: LogContext): Logger;
}

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const normalizeLevel = (value: string | undefined): LogLevel => {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
};

const activeLevel = normalizeLevel(process.env.LOG_LEVEL);

const shouldLog = (level: LogLevel) => {
  return levelPriority[level] >= levelPriority[activeLevel];
};

const writeLog = (level: LogLevel, message: string, context: LogContext = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

const createLogger = (defaultContext: LogContext = {}): Logger => {
  const logWithLevel = (level: LogLevel, message: string, context: LogContext = {}) => {
    writeLog(level, message, { ...defaultContext, ...context });
  };

  return {
    debug(message, context) {
      logWithLevel("debug", message, context);
    },
    info(message, context) {
      logWithLevel("info", message, context);
    },
    warn(message, context) {
      logWithLevel("warn", message, context);
    },
    error(message, context) {
      logWithLevel("error", message, context);
    },
    child(context) {
      return createLogger({ ...defaultContext, ...context });
    }
  };
};

export const logger = createLogger();
export type { LogContext, LogLevel, Logger };
