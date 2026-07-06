import type { Page } from "playwright";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  getAttr,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";
import type { Publication } from "../models/profile.js";

export async function scrapePublications(page: Page, ctx: ScraperContext): Promise<Publication[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "publications"));
  await scrollToLoad(page, 2);

  const items = await extractListItems(page);
  const results: Publication[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const title = texts[0] ?? "";
    const publisher = texts[1] ?? "";
    const date = texts.find((t) => /\d{4}/.test(t)) ?? null;
    const linkEl = item.locator("a[href]").first();
    const url = await getAttr(linkEl, "href");
    const description = texts.slice(2).join(" ");

    if (!title) continue;

    results.push({ title, publisher, date, url, description });
  }

  return results;
}

export async function scrapeRecommendationsCount(page: Page, ctx: ScraperContext): Promise<number | null> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "recommendations"));
  await scrollToLoad(page, 1);

  const bodyText = (await page.locator("main").innerText().catch(() => "")).toLowerCase();
  const match = bodyText.match(/(\d+)\s*(recommendation|tavsiye)/i);
  if (match) return Number(match[1]);

  const items = await extractListItems(page);
  return items.length > 0 ? items.length : null;
}
