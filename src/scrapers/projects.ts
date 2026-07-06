import type { Page } from "playwright";
import type { Project } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  getAttr,
  parseDateRange,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeProjects(page: Page, ctx: ScraperContext): Promise<Project[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "projects"));
  await scrollToLoad(page, 3);

  const items = await extractListItems(page);
  const results: Project[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const name = texts[0] ?? "";
    const dateLine = texts.find((t) => /\d{4}|present|şimdi/i.test(t)) ?? "";
    const { start, end } = parseDateRange(dateLine);
    const linkEl = item.locator("a[href]").first();
    const url = await getAttr(linkEl, "href");
    const description = texts.slice(1).filter((t) => t !== dateLine).join(" ");

    if (!name) continue;

    results.push({
      name,
      description,
      url: url && !url.includes("linkedin.com") ? url : null,
      startDate: start,
      endDate: end,
    });
  }

  return results;
}
