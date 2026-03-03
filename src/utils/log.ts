let enabled = true;

export const setLoggingEnabled = (value: boolean) => {
  enabled = value;
};

export const isLoggingEnabled = () => enabled;

export const log = (...args: any[]) => {
  if (enabled) {
    console.log(...args);
  }
};

// Convenience for scoped loggers: logWith('Module')(...) prepends label
export const logWith =
  (label: string) =>
  (...args: any[]) => {
    log(`[${label}]`, ...args);
  };

export const warn = (...args: any[]) => {
  if (enabled) {
    console.warn(...args);
  }
};

export const error = (...args: any[]) => {
  if (enabled) {
    console.error(...args);
  }
};
