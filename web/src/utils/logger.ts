const isDev = import.meta.env.MODE !== 'production';

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isDev) return;
    console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (!isDev) return;
    console.info(...args);
  },
  warn: (...args: unknown[]) => {
    // Always show warnings in dev; in prod, still show as console.warn
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

export default logger;
