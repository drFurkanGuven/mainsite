import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { EnvConfig } from "../utils/env.js";
import { hasAuthState } from "../utils/env.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { dismissOverlays } from "../utils/selectors.js";

const log = createLogger("auth");

const LOGIN_URL = "https://www.linkedin.com/login";
const CHECKPOINT_PATTERN = /checkpoint|challenge|two-step|verification/i;

export interface AuthSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function createSession(env: EnvConfig): Promise<AuthSession> {
  await mkdir(dirname(env.authStatePath), { recursive: true });

  const browser = await chromium.launch({
    headless: env.headless,
    slowMo: env.slowMo,
  });

  const contextOptions: Parameters<typeof browser.newContext>[0] = {
    viewport: { width: 1280, height: 900 },
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  };

  if (hasAuthState(env.authStatePath)) {
    log.info("Loading saved browser session");
    contextOptions.storageState = env.authStatePath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  return { browser, context, page };
}

export async function ensureAuthenticated(session: AuthSession, env: EnvConfig): Promise<void> {
  const { page, context } = session;

  await page.goto(env.profileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);
  await dismissOverlays(page);

  if (await isLoggedIn(page)) {
    log.info("Session is authenticated");
    await saveSession(context, env.authStatePath);
    return;
  }

  log.info("Not authenticated — starting login flow");
  await performLogin(page, env);
  await handleSecurityCheckpoint(page);
  await verifyLogin(page, env.profileUrl);

  await saveSession(context, env.authStatePath);
  log.info("Login successful, session saved");
}

async function performLogin(page: Page, env: EnvConfig): Promise<void> {
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

  await withRetry(async () => {
    await page.fill("#username", env.email);
    await page.fill("#password", env.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }, { label: "login form submit" });
}

async function handleSecurityCheckpoint(page: Page): Promise<void> {
  const url = page.url();
  if (!CHECKPOINT_PATTERN.test(url)) return;

  log.warn("Security checkpoint or 2FA detected");
  log.warn("Complete verification in the browser window…");

  if (!process.env.LINKEDIN_HEADLESS || process.env.LINKEDIN_HEADLESS === "false") {
    log.info("Waiting up to 5 minutes for manual completion…");
    await page.waitForURL(
      (u) => !CHECKPOINT_PATTERN.test(u.toString()) && !u.toString().includes("/login"),
      { timeout: 300_000 }
    ).catch(() => {
      log.error("Timed out waiting for 2FA/checkpoint completion");
      throw new Error("2FA/checkpoint not completed in time");
    });
  } else {
    throw new Error(
      "2FA required. Set LINKEDIN_HEADLESS=false in .env and run again."
    );
  }
}

async function verifyLogin(page: Page, profileUrl: string): Promise<void> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);

  if (!(await isLoggedIn(page))) {
    throw new Error("Login verification failed — could not access profile");
  }
}

async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes("/login") || CHECKPOINT_PATTERN.test(url)) return false;

  const signIn = page.locator('a[href*="/login"]').first();
  if (await signIn.isVisible().catch(() => false)) return false;

  const profileIndicators = [
    "section.artdeco-card",
    "div[data-view-name='profile-card']",
    "main section",
    ".pv-top-card",
  ];

  for (const sel of profileIndicators) {
    if (await page.locator(sel).first().isVisible().catch(() => false)) return true;
  }

  return !url.includes("/authwall");
}

async function saveSession(context: BrowserContext, path: string): Promise<void> {
  await context.storageState({ path });
  log.info(`Session saved to ${path}`);
}

export async function closeSession(session: AuthSession): Promise<void> {
  await session.context.close();
  await session.browser.close();
}
