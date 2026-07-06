import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

config({ path: resolve(ROOT, ".env") });

export interface EnvConfig {
  email: string;
  password: string;
  profileUrl: string;
  headless: boolean;
  slowMo: number;
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

export function loadEnv(): EnvConfig {
  return {
    email: requireEnv("LINKEDIN_EMAIL"),
    password: requireEnv("LINKEDIN_PASSWORD"),
    profileUrl: requireEnv("LINKEDIN_PROFILE_URL").replace(/\/?$/, "/"),
    headless: process.env.LINKEDIN_HEADLESS !== "false",
    slowMo: Number(process.env.LINKEDIN_SLOW_MO || 0),
    rootDir: ROOT,
    authStatePath: resolve(ROOT, ".auth/linkedin-state.json"),
    profileOutputPath: resolve(ROOT, "data/profile.json"),
    siteConfigPath: resolve(ROOT, "data/site.json"),
  };
}

export function hasAuthState(path: string): boolean {
  return existsSync(path);
}
