import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { resolveBrowserEngine, authStatePathForEngine, browserProfileDir, type BrowserEngine } from "./browser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

config({ path: resolve(ROOT, ".env") });

export interface EnvConfig {
  email: string;
  password: string;
  profileUrl: string;
  headless: boolean;
  slowMo: number;
  browser: BrowserEngine;
  browserProfileDir: string;
  rootDir: string;
  authStatePath: string;
  profileOutputPath: string;
  siteConfigPath: string;
}

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

export function loadEnv(): EnvConfig {
  const browser = resolveBrowserEngine();
  const rootDir = ROOT;
  const manualLogin = process.env.LINKEDIN_MANUAL_LOGIN !== "false";

  return {
    email: manualLogin ? optionalEnv("LINKEDIN_EMAIL") : requireEnv("LINKEDIN_EMAIL"),
    password: manualLogin ? optionalEnv("LINKEDIN_PASSWORD") : requireEnv("LINKEDIN_PASSWORD"),
    profileUrl: requireEnv("LINKEDIN_PROFILE_URL").replace(/\/?$/, "/"),
    headless: process.env.LINKEDIN_HEADLESS !== "false",
    slowMo: Number(process.env.LINKEDIN_SLOW_MO || 0),
    browser,
    browserProfileDir: browserProfileDir(rootDir, browser),
    rootDir,
    authStatePath: authStatePathForEngine(rootDir, browser),
    profileOutputPath: resolve(rootDir, "data/profile.json"),
    siteConfigPath: resolve(rootDir, "data/site.json"),
  };
}

export function hasAuthState(path: string): boolean {
  return existsSync(path);
}
