const levelPriority = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const normalizeLevel = (value) => {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
};

const activeLevel = normalizeLevel(process.env.LOG_LEVEL);

const shouldLog = (level) => {
  return levelPriority[level] >= levelPriority[activeLevel];
};

const writeLog = (level, message, context = {}) => {
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

const createLogger = (defaultContext = {}) => {
  const logWithLevel = (level, message, context = {}) => {
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
