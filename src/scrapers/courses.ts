import type { Page } from "playwright";
import type { Course } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeCourses(page: Page, ctx: ScraperContext): Promise<Course[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "courses"));
  await scrollToLoad(page, 3);

  const items = await extractListItems(page);
  const results: Course[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const name = texts[0] ?? "";
    const provider = texts[1] ?? "";
    const date = texts.find((t) => /\d{4}/.test(t)) ?? null;

    if (!name) continue;

    results.push({ name, provider, date });
  }

  return results;
}
