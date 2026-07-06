import type { Page } from "playwright";
import type { Volunteer } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  parseDateRange,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeVolunteer(page: Page, ctx: ScraperContext): Promise<Volunteer[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "volunteering-experiences"));
  await scrollToLoad(page, 3);

  const items = await extractListItems(page);
  const results: Volunteer[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const role = texts[0] ?? "";
    const organization = texts[1] ?? "";
    const cause = texts.find((t) => /cause|education|health|sosyal/i.test(t)) ?? "";
    const dateLine = texts.find((t) => /\d{4}|present|şimdi/i.test(t)) ?? "";
    const { start, end } = parseDateRange(dateLine);
    const description = texts.slice(2).filter((t) => t !== dateLine && t !== cause).join(" ");

    if (!role && !organization) continue;

    results.push({
      organization,
      role,
      cause,
      startDate: start,
      endDate: end,
      description,
    });
  }

  return results;
}
