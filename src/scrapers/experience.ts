import type { Page } from "playwright";
import type { Experience } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractImageUrl,
  extractItemTexts,
  extractListItems,
  parseDateRange,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeExperience(page: Page, ctx: ScraperContext): Promise<Experience[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "experience"));
  await scrollToLoad(page, 5);

  const items = await extractListItems(page);
  const results: Experience[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const position = texts[0] ?? "";
    const company = texts[1] ?? texts[0] ?? "";
    const dateLine = texts.find((t) => /\d{4}|present|şimdi|devam|yıl|ay/i.test(t)) ?? "";
    const employmentType = texts.find((t) =>
      /full-time|part-time|contract|freelance|internship|tam zamanlı|yarı zamanlı|staj/i.test(t)
    ) ?? null;

    const { start, end, current } = parseDateRange(dateLine);
    const description = texts.slice(2).filter((t) => t !== dateLine && t !== employmentType).join(" ");
    const companyLogoUrl = await extractImageUrl(item);

    if (!position && !company) continue;

    results.push({
      company,
      position,
      employmentType,
      startDate: start,
      endDate: end,
      current,
      description,
      companyLogoUrl,
    });
  }

  return dedupeExperience(results);
}

function dedupeExperience(items: Experience[]): Experience[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.company}|${item.position}|${item.startDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
