import type { Page, Locator } from "playwright";
import { withRetry } from "./retry.js";
import { createLogger } from "./logger.js";

const log = createLogger("selectors");

/** Try multiple locators; return first that matches at least minCount elements */
export async function queryAll(
  page: Page,
  selectors: string[],
  minCount = 1
): Promise<Locator | null> {
  for (const sel of selectors) {
    const loc = page.locator(sel);
    const count = await loc.count().catch(() => 0);
    if (count >= minCount) {
      log.debug(`Matched selector: ${sel} (${count} elements)`);
      return loc;
    }
  }
  return null;
}

export async function queryFirst(page: Page, selectors: string[]): Promise<Locator | null> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.count().catch(() => 0)) {
      if (await loc.isVisible().catch(() => false)) {
        log.debug(`Matched selector: ${sel}`);
        return loc;
      }
    }
  }
  return null;
}

export async function getText(loc: Locator | null): Promise<string> {
  if (!loc) return "";
  return (await loc.innerText().catch(() => "")).trim().replace(/\s+/g, " ");
}

export async function getAttr(loc: Locator | null, attr: string): Promise<string | null> {
  if (!loc) return null;
  return loc.getAttribute(attr).catch(() => null);
}

export async function scrollToLoad(page: Page, passes = 4): Promise<void> {
  for (let i = 0; i < passes; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

export async function dismissOverlays(page: Page): Promise<void> {
  const dismissSelectors = [
    'button[aria-label="Dismiss"]',
    'button[aria-label="Kapat"]',
    'button:has-text("Not now")',
    'button:has-text("Şimdi değil")',
  ];
  for (const sel of dismissSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  }
}

export async function safeNavigate(page: Page, url: string): Promise<void> {
  await withRetry(
    async () => {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await dismissOverlays(page);
      await page.waitForTimeout(800);
    },
    { label: `navigate ${url}` }
  );
}

export function profileSlug(profileUrl: string): string {
  const match = profileUrl.match(/linkedin\.com\/in\/([^/]+)/i);
  if (!match) throw new Error("Invalid LINKEDIN_PROFILE_URL");
  return decodeURIComponent(match[1]);
}

export function detailsUrl(profileUrl: string, section: string): string {
  const base = profileUrl.replace(/\/?$/, "");
  return `${base}/details/${section}/`;
}

/** Parse LinkedIn list items from detail pages */
export async function extractListItems(page: Page): Promise<Locator[]> {
  const container = await queryAll(page, [
    "main div.scaffold-finite-scroll__content ul",
    "main ul.pvs-list",
    "div[data-view-name='profile-component-entity']",
    "main ul",
  ]);

  if (!container) return [];

  const itemSelectors = [
    "li.pvs-list__paged-list-item",
    "li.artdeco-list__item",
    "div[data-view-name='profile-component-entity']",
  ];

  for (const sel of itemSelectors) {
    const items = container.locator(sel);
    const count = await items.count();
    if (count > 0) return Array.from({ length: count }, (_, i) => items.nth(i));
  }

  const count = await container.count();
  if (count > 1) {
    return Array.from({ length: count }, (_, i) => container.nth(i));
  }

  return [container];
}

export async function extractItemTexts(item: Locator): Promise<string[]> {
  const spans = item.locator("span[aria-hidden='true']");
  const count = await spans.count();
  const texts: string[] = [];

  for (let i = 0; i < count; i++) {
    const t = (await spans.nth(i).innerText().catch(() => "")).trim();
    if (t && !texts.includes(t)) texts.push(t);
  }

  if (texts.length === 0) {
    const fallback = (await item.innerText().catch(() => "")).trim();
    if (fallback) texts.push(...fallback.split("\n").map((l) => l.trim()).filter(Boolean));
  }

  return texts;
}

export async function extractImageUrl(item: Locator): Promise<string | null> {
  const img = item.locator("img").first();
  if (!(await img.count())) return null;
  return img.getAttribute("src").catch(() => null);
}

export function parseDateRange(text: string): { start: string | null; end: string | null; current: boolean } {
  const cleaned = text.replace(/·/g, " ").replace(/\s+/g, " ").trim();
  const current = /\b(present|şimdi|devam|ongoing)\b/i.test(cleaned);
  const parts = cleaned.split(/[-–—]| to | - /i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { start: parts[0], end: current ? null : parts[parts.length - 1], current };
  }
  if (parts.length === 1) {
    return { start: parts[0], end: null, current };
  }
  return { start: null, end: null, current };
}

export async function clickShowAll(page: Page, sectionPattern: RegExp): Promise<boolean> {
  const link = page.getByRole("link", { name: sectionPattern }).first();
  if (await link.isVisible().catch(() => false)) {
    await link.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}
