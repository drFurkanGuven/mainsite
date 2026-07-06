import type { Page } from "playwright";

export interface ScraperContext {
  page: Page;
  profileUrl: string;
}

export interface ScraperResult<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export type SectionScraper<T> = (page: Page, ctx: ScraperContext) => Promise<T>;
