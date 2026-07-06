type LogLevel = "info" | "warn" | "error" | "debug";

const COLORS: Record<LogLevel, string> = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
};

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, section: string, message: string): void {
  const color = COLORS[level];
  const reset = "\x1b[0m";
  const prefix = `${color}[${timestamp()}] [${level.toUpperCase()}] [${section}]${reset}`;
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`${prefix} ${message}`);
}

export function createLogger(section: string) {
  return {
    info: (msg: string) => log("info", section, msg),
    warn: (msg: string) => log("warn", section, msg),
    error: (msg: string) => log("error", section, msg),
    debug: (msg: string) => log("debug", section, msg),
  };
}

export const logger = createLogger("sync");
