import type { BrowserContext, Page } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { EnvConfig } from "../utils/env.js";
import { launchPersistentContext } from "../utils/browser.js";
import { createLogger } from "../utils/logger.js";
import { dismissOverlays, profileSlug } from "../utils/selectors.js";

const log = createLogger("auth");

const LOGIN_URL = "https://www.linkedin.com/login";
const CHECKPOINT_PATTERN = /checkpoint|challenge|two-step|verification|security/i;
const GUEST_PATTERN = /join linkedin|linkedin'e katıl|linkedin’e katıl|sign in|giriş yap|oturum aç|authwall|dismiss/i;

export interface AuthSession {
  context: BrowserContext;
  page: Page;
}

export async function createSession(env: EnvConfig): Promise<AuthSession> {
  await mkdir(dirname(env.authStatePath), { recursive: true });
  await mkdir(env.browserProfileDir, { recursive: true });

  const context = await launchPersistentContext(env);
  const page = context.pages()[0] ?? (await context.newPage());

  return { context, page };
}

export async function ensureAuthenticated(session: AuthSession, env: EnvConfig): Promise<void> {
  const { page, context } = session;
  const manualLogin = process.env.LINKEDIN_MANUAL_LOGIN !== "false";

  await page.goto(env.profileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2000);
  await dismissOverlays(page);

  if (await isLoggedInStrict(page, env.profileUrl)) {
    log.info("Already logged in");
    await saveSession(context, env.authStatePath);
    return;
  }

  if (manualLogin) {
    await manualLoginFlow(page, env);
  } else {
    await automatedLoginFlow(page, env);
  }

  await saveSession(context, env.authStatePath);
  log.info("Login successful, session saved");
}

async function manualLoginFlow(page: Page, env: EnvConfig): Promise<void> {
  log.info("Manual login mode — script will NOT navigate until you sign in");
  log.info("1. Use the Safari window to log in to LinkedIn");
  log.info("2. Complete 2FA if prompted");
  log.info("3. Open your profile page when done");
  log.info("Waiting up to 10 minutes…");

  const loginPage = page.url().includes("/login") ? page.url() : LOGIN_URL;
  if (!page.url().includes("/login") && !await isLoggedInStrict(page, env.profileUrl)) {
    await page.goto(loginPage, { waitUntil: "domcontentloaded" });
  }

  const deadline = Date.now() + 600_000;
  let lastLog = 0;

  while (Date.now() < deadline) {
    await dismissOverlays(page);

    if (CHECKPOINT_PATTERN.test(page.url())) {
      if (Date.now() - lastLog > 15_000) {
        log.info("Verification page open — complete it in Safari, do not close the window");
        lastLog = Date.now();
      }
      await page.waitForTimeout(2000);
      continue;
    }

    if (await isLoggedInStrict(page, env.profileUrl)) {
      log.info("Login detected");
      return;
    }

    if (Date.now() - lastLog > 30_000) {
      log.info(`Still waiting… current page: ${page.url()}`);
      lastLog = Date.now();
    }

    await page.waitForTimeout(2000);
  }

  throw new Error("Login timeout — complete LinkedIn sign-in in Safari and run again");
}

async function automatedLoginFlow(page: Page, env: EnvConfig): Promise<void> {
  log.info("Automated login — submitting credentials");

  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  await page.fill("#username", env.email);
  await page.fill("#password", env.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  if (CHECKPOINT_PATTERN.test(page.url())) {
    log.warn("2FA/checkpoint detected — switch to manual: LINKEDIN_MANUAL_LOGIN=true");
    await manualLoginFlow(page, env);
    return;
  }

  await page.goto(env.profileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2000);

  if (!(await isLoggedInStrict(page, env.profileUrl))) {
    throw new Error("Automated login failed — use LINKEDIN_MANUAL_LOGIN=true");
  }
}

export async function isLoggedInStrict(page: Page, profileUrl: string): Promise<boolean> {
  const url = page.url();

  if (url.includes("/login") || url.includes("/authwall") || CHECKPOINT_PATTERN.test(url)) {
    return false;
  }

  const h1 = (await page.locator("main h1").first().innerText().catch(() => "")).trim();
  if (GUEST_PATTERN.test(h1)) return false;

  const title = (await page.title().catch(() => "")).toLowerCase();
  if (GUEST_PATTERN.test(title)) return false;

  const slug = profileSlug(profileUrl);
  const onOwnProfile = url.includes(`/in/${slug}`);

  if (!onOwnProfile) {
    const feedLink = page.locator('a[href*="/feed/"]').first();
    const navMe = page.locator(`a[href*="/in/${slug}"]`).first();
    const hasNav = await feedLink.isVisible().catch(() => false)
      || await navMe.isVisible().catch(() => false);
    if (!hasNav) return false;
  }

  if (onOwnProfile) {
    const joinCta = page.getByRole("link", { name: /join|katıl|sign up/i }).first();
    if (await joinCta.isVisible().catch(() => false)) return false;

    const experienceSection = page.locator("section").filter({
      has: page.getByText(/^Experience$|^Deneyim$/i),
    });
    const hasSections = await experienceSection.count() > 0
      || await page.locator("div[data-view-name='profile-card']").count() > 0;

    return hasSections || h1.length > 2;
  }

  return true;
}

export async function assertLoggedInBeforeScrape(page: Page, profileUrl: string): Promise<void> {
  await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);
  await dismissOverlays(page);

  if (!(await isLoggedInStrict(page, profileUrl))) {
    throw new Error(
      "Not logged in — profile shows guest page. Run sync again with LINKEDIN_MANUAL_LOGIN=true"
    );
  }
}

async function saveSession(context: BrowserContext, path: string): Promise<void> {
  await context.storageState({ path });
  log.info(`Session saved to ${path}`);
}

export async function closeSession(session: AuthSession): Promise<void> {
  await session.context.close();
}
