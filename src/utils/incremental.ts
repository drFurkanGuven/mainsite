import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { existsSync } from "node:fs";
import type { LinkedInProfile } from "../models/profile.js";
import { createLogger } from "./logger.js";

const log = createLogger("incremental");

export async function loadPreviousProfile(path: string): Promise<LinkedInProfile | null> {
  if (!existsSync(path)) return null;
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as LinkedInProfile;
  } catch {
    log.warn("Could not parse previous profile.json — starting fresh");
    return null;
  }
}

export function mergeIncremental(
  previous: LinkedInProfile | null,
  current: LinkedInProfile
): LinkedInProfile {
  if (!previous) {
    return { ...current, _sync: { changes: ["initial scrape"], previousUpdatedAt: null } };
  }

  const changes: string[] = [];

  if (previous.personal.fullName !== current.personal.fullName) changes.push("personal.fullName");
  if (previous.personal.headline !== current.personal.headline) changes.push("personal.headline");
  if (previous.personal.about !== current.personal.about) changes.push("personal.about");

  const sections = [
    "experience",
    "education",
    "certifications",
    "courses",
    "projects",
    "skills",
    "languages",
    "awards",
    "volunteer",
    "publications",
  ] as const;

  for (const section of sections) {
    const prevLen = previous[section].length;
    const curLen = current[section].length;
    if (prevLen !== curLen) {
      changes.push(`${section}: ${prevLen} → ${curLen} items`);
    } else if (JSON.stringify(previous[section]) !== JSON.stringify(current[section])) {
      changes.push(`${section}: content changed`);
    }
  }

  if (previous.recommendationsCount !== current.recommendationsCount) {
    changes.push("recommendationsCount");
  }

  if (changes.length === 0) {
    log.info("No changes detected since last sync");
  } else {
    log.info(`Changes detected: ${changes.join(", ")}`);
  }

  return {
    ...current,
    _sync: { changes, previousUpdatedAt: previous.updatedAt },
  };
}

export async function saveProfile(path: string, profile: LinkedInProfile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(profile, null, 2) + "\n", "utf8");
  log.info(`Saved profile to ${path}`);
}
