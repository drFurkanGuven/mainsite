import type { Page } from "playwright";
import type { Award } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeAwards(page: Page, ctx: ScraperContext): Promise<Award[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "honors"));
  await scrollToLoad(page, 2);

  const items = await extractListItems(page);
  const results: Award[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const title = texts[0] ?? "";
    const issuer = texts[1] ?? "";
    const date = texts.find((t) => /\d{4}/.test(t)) ?? null;
    const description = texts.slice(2).join(" ");

    if (!title) continue;

    results.push({ title, issuer, date, description });
  }

  return results;
}
