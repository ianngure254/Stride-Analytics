type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const writeLog = (level: LogLevel, message: string, meta?: unknown) => {
  const timestamp = new Date().toISOString();
  const payload = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
  console[level](`[${timestamp}] ${level.toUpperCase()} ${message}${payload}`);
};

export const logger = {
  debug: (message: string, meta?: unknown) => writeLog('debug', message, meta),
  info: (message: string, meta?: unknown) => writeLog('info', message, meta),
  warn: (message: string, meta?: unknown) => writeLog('warn', message, meta),
  error: (message: string, meta?: unknown) => writeLog('error', message, meta),
};
