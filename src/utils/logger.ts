type LogLevel = "info" | "warn" | "error" | "debug";

interface LogOptions {
  context?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, options?: LogOptions) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(options?.context && { context: options.context }),
  };
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(logEntry);
  } else {
    return (
      `[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}` +
      (options?.context ? ` | context: ${JSON.stringify(options.context)}` : "")
    );
  }
}

export const bunLogger = {
  info: (msg: string, options?: LogOptions) => {
    console.log(formatLog("info", msg, options));
  },
  warn: (msg: string, options?: LogOptions) => {
    console.warn(formatLog("warn", msg, options));
  },
  error: (msg: string, options?: LogOptions) => {
    console.error(formatLog("error", msg, options));
  },
  debug: (msg: string, options?: LogOptions) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", msg, options));
    }
  },
};
