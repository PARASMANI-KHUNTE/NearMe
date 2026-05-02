const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (process.env.NODE_ENV !== 'production');

const colors = {
  debug: '\u001b[90m',
  info: '\u001b[36m',
  warn: '\u001b[33m',
  error: '\u001b[31m',
  reset: '\u001b[0m',
};

const label = (level: 'debug' | 'info' | 'warn' | 'error') =>
  `${colors[level]}[${level.toUpperCase()}]${colors.reset}`;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(label('debug'), ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(label('info'), ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(label('warn'), ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(label('error'), ...args);
  },
};

export default logger;
