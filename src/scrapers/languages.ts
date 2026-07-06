import type { Page } from "playwright";
import type { Language } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

const PROFICIENCY_PATTERN =
  /elementary|limited working|professional working|full professional|native|bilir|sınırlı|profesyonel|ana dil/i;

export async function scrapeLanguages(page: Page, ctx: ScraperContext): Promise<Language[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "languages"));
  await scrollToLoad(page, 2);

  const items = await extractListItems(page);
  const results: Language[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const name = texts[0] ?? "";
    const proficiency =
      texts.find((t) => PROFICIENCY_PATTERN.test(t)) ?? texts[1] ?? "";

    if (!name) continue;

    results.push({ name, proficiency });
  }

  return results;
}
