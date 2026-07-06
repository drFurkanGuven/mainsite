import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { LinkedInProfile } from "../models/profile.js";
import { createLogger } from "./logger.js";

const log = createLogger("site-sync");

interface SiteProfile {
  meta: Record<string, string>;
  identity: {
    name: string;
    headline: string;
    location: string;
  };
  links: Record<string, unknown>;
  github: Record<string, unknown>;
  projects: unknown[];
  experience: SiteExperience[];
  education: SiteEducation[];
  certificates: SiteCertificate[];
  skills: string[];
  linkedin: {
    syncEnabled: boolean;
    lastSynced: string | null;
    source: string;
    profilePath: string;
  };
}

interface SiteExperience {
  period: string;
  title: string;
  role: string;
  description: string;
  items?: string[];
}

interface SiteEducation {
  period: string;
  title: string;
  institution: string;
}

interface SiteCertificate {
  period: string;
  title: string;
}

function formatPeriod(start: string | null, end: string | null, current: boolean): string {
  if (current) return start ? `${start} —` : "Devam ediyor";
  if (start && end) return `${start} — ${end}`;
  if (start) return start;
  return "";
}

export async function syncSiteFromLinkedIn(
  sitePath: string,
  linkedin: LinkedInProfile
): Promise<void> {
  if (!existsSync(sitePath)) {
    log.warn(`Site config not found at ${sitePath} — skipping site sync`);
    return;
  }

  const raw = await readFile(sitePath, "utf8");
  const site = JSON.parse(raw) as SiteProfile;

  site.identity.name = linkedin.personal.fullName || site.identity.name;
  site.identity.headline = linkedin.personal.headline || site.identity.headline;
  site.identity.location = linkedin.personal.location || site.identity.location;

  site.experience = linkedin.experience.map((exp) => ({
    period: formatPeriod(exp.startDate, exp.endDate, exp.current),
    title: exp.company,
    role: exp.position,
    description: exp.description,
    items: exp.employmentType ? [exp.employmentType] : undefined,
  }));

  site.education = linkedin.education.map((edu) => ({
    period: formatPeriod(edu.startDate, edu.endDate, !edu.endDate),
    title: edu.degree || edu.fieldOfStudy || edu.school,
    institution: edu.school,
  }));

  site.certificates = linkedin.certifications.map((cert) => ({
    period: cert.issueDate ?? "",
    title: cert.name,
  }));

  if (linkedin.skills.length > 0) {
    site.skills = linkedin.skills.map((s) => s.name);
  }

  site.linkedin.lastSynced = linkedin.updatedAt;
  site.linkedin.source = "playwright";
  site.linkedin.syncEnabled = true;

  await writeFile(sitePath, JSON.stringify(site, null, 2) + "\n", "utf8");
  log.info(`Updated site config: ${sitePath}`);
}
