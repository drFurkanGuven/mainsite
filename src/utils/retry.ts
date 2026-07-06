import { createLogger } from "./logger.js";

const log = createLogger("retry");

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  backoff?: number;
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { attempts = 3, delayMs = 1000, backoff = 2, label = "operation" } = options;
  let lastError: unknown;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (i < attempts) {
        const wait = delayMs * Math.pow(backoff, i - 1);
        log.warn(`${label} failed (attempt ${i}/${attempts}): ${msg}. Retrying in ${wait}ms…`);
        await sleep(wait);
      } else {
        log.error(`${label} failed after ${attempts} attempts: ${msg}`);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
