import type { Page } from "playwright";
import type { Education } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  parseDateRange,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeEducation(page: Page, ctx: ScraperContext): Promise<Education[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "education"));
  await scrollToLoad(page, 4);

  const items = await extractListItems(page);
  const results: Education[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const school = texts[0] ?? "";
    const degree = texts[1] ?? "";
    const fieldOfStudy = texts[2] ?? "";
    const dateLine = texts.find((t) => /\d{4}|present|şimdi|devam/i.test(t)) ?? "";
    const { start, end } = parseDateRange(dateLine);
    const description = texts.slice(3).filter((t) => t !== dateLine).join(" ");

    if (!school) continue;

    results.push({
      school,
      degree,
      fieldOfStudy,
      startDate: start,
      endDate: end,
      description,
    });
  }

  return results;
}
