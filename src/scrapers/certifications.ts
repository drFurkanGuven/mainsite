import type { Page } from "playwright";
import type { Certification } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  detailsUrl,
  extractItemTexts,
  extractListItems,
  getAttr,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapeCertifications(page: Page, ctx: ScraperContext): Promise<Certification[]> {
  await safeNavigate(page, detailsUrl(ctx.profileUrl, "certifications"));
  await scrollToLoad(page, 3);

  const items = await extractListItems(page);
  const results: Certification[] = [];

  for (const item of items) {
    const texts = await extractItemTexts(item);
    if (texts.length === 0) continue;

    const name = texts[0] ?? "";
    const issuingOrganization = texts[1] ?? "";
    const dateLine = texts.find((t) => /\d{4}|issued|verildi/i.test(t)) ?? texts[2] ?? "";
    const credentialId = texts.find((t) => /credential|sertifika id/i.test(t))?.replace(/.*?:\s*/i, "") ?? null;
    const linkEl = item.locator("a[href*='credential'], a[href*='certificate']").first();
    const credentialUrl = await getAttr(linkEl, "href");

    if (!name) continue;

    results.push({
      name,
      issuingOrganization,
      issueDate: dateLine || null,
      expirationDate: null,
      credentialId,
      credentialUrl,
    });
  }

  return results;
}
