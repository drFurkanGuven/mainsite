import { webkit, chromium, type BrowserContext, type BrowserType } from "playwright";
import { resolve } from "node:path";
import type { EnvConfig } from "./env.js";
import { createLogger } from "./logger.js";

const log = createLogger("browser");

export type BrowserEngine = "webkit" | "chromium";

export function resolveBrowserEngine(): BrowserEngine {
  const raw = (process.env.LINKEDIN_BROWSER || "webkit").toLowerCase();
  if (raw === "safari" || raw === "webkit") return "webkit";
  if (raw === "chrome" || raw === "chromium") return "chromium";
  log.warn(`Unknown LINKEDIN_BROWSER="${raw}", falling back to webkit (Safari)`);
  return "webkit";
}

export function browserProfileDir(rootDir: string, engine: BrowserEngine): string {
  const suffix = engine === "webkit" ? "webkit" : "chromium";
  return resolve(rootDir, `.auth/browser-profile-${suffix}`);
}

export function authStatePathForEngine(rootDir: string, engine: BrowserEngine): string {
  const suffix = engine === "webkit" ? "webkit" : "chromium";
  return resolve(rootDir, `.auth/linkedin-state-${suffix}.json`);
}

export async function launchPersistentContext(env: EnvConfig): Promise<BrowserContext> {
  const engine = env.browser;
  const launcher: BrowserType = engine === "webkit" ? webkit : chromium;
  const label = engine === "webkit" ? "Safari (WebKit)" : "Chromium";
  const userDataDir = env.browserProfileDir;

  log.info(`Launching ${label} persistent profile${env.headless ? " headless" : ""}`);

  return launcher.launchPersistentContext(userDataDir, {
    headless: env.headless,
    slowMo: env.slowMo,
    viewport: { width: 1280, height: 900 },
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  });
}
