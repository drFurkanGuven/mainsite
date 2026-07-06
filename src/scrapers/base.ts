import type { Page } from "playwright";
import { createLogger } from "../utils/logger.js";
import type { ScraperContext, ScraperResult } from "./types.js";

const log = createLogger("scraper");

export async function runScraper<T>(
  name: string,
  ctx: ScraperContext,
  fn: (page: Page, ctx: ScraperContext) => Promise<T>,
  fallback: T
): Promise<ScraperResult<T>> {
  try {
    log.info(`Scraping ${name}…`);
    const data = await fn(ctx.page, ctx);
    log.info(`${name}: ${Array.isArray(data) ? data.length + " items" : "done"}`);
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`${name} failed: ${msg}`);
    return { ok: false, data: fallback, error: msg };
  }
}

export async function runScraperSafe<T>(
  name: string,
  ctx: ScraperContext,
  fn: (page: Page, ctx: ScraperContext) => Promise<T>,
  fallback: T
): Promise<T> {
  const result = await runScraper(name, ctx, fn, fallback);
  return result.data;
}
