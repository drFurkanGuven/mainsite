import type { Page } from "playwright";
import type { Skill } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeSkills(page: Page, ctx: ScraperContext): Promise<Skill[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "skills"));
  await scrollToLoad(page, 5);

  const items = await extractListItems(page);
  const results: Skill[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const name = texts[0] ?? "";
    const endorsementMatch = texts.join(" ").match(/(\d+)\s*(endorsement|onay|takdir)/i);
    const endorsementCount = endorsementMatch ? Number(endorsementMatch[1]) : null;

    if (!name || name.length > 80) continue;

    results.push({ name, endorsementCount });
  }

  return dedupeSkills(results);
}

function dedupeSkills(items: Skill[]): Skill[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
