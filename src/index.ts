import { loadEnv } from "./utils/env.js";
import { logger } from "./utils/logger.js";
import { createSession, ensureAuthenticated, closeSession, assertLoggedInBeforeScrape } from "./auth/linkedin-auth.js";
import { emptyProfile } from "./models/profile.js";
import { runScraperSafe } from "./scrapers/base.js";
import { scrapePersonal } from "./scrapers/personal.js";
import { scrapeExperience } from "./scrapers/experience.js";
import { scrapeEducation } from "./scrapers/education.js";
import { scrapeCertifications } from "./scrapers/certifications.js";
import { scrapeCourses } from "./scrapers/courses.js";
import { scrapeProjects } from "./scrapers/projects.js";
import { scrapeSkills } from "./scrapers/skills.js";
import { scrapeLanguages } from "./scrapers/languages.js";
import { scrapeVolunteer } from "./scrapers/volunteer.js";
import { scrapeAwards } from "./scrapers/awards.js";
import { scrapePublications, scrapeRecommendationsCount } from "./scrapers/publications.js";
import {
  loadPreviousProfile,
  mergeIncremental,
  saveProfile,
} from "./utils/incremental.js";
import { validateProfile } from "./utils/validate.js";
import type { ScraperContext } from "./scrapers/types.js";

async function main(): Promise<void> {
  logger.info("LinkedIn profile synchronizer starting…");

  const env = loadEnv();
  const session = await createSession(env);

  try {
    await ensureAuthenticated(session, env);
    await assertLoggedInBeforeScrape(session.page, env.profileUrl);

    const ctx: ScraperContext = {
      page: session.page,
      profileUrl: env.profileUrl,
    };

    const base = emptyProfile();

    base.personal = await runScraperSafe("personal", ctx, scrapePersonal, base.personal);
    base.experience = await runScraperSafe("experience", ctx, scrapeExperience, []);
    base.education = await runScraperSafe("education", ctx, scrapeEducation, []);
    base.certifications = await runScraperSafe("certifications", ctx, scrapeCertifications, []);
    base.courses = await runScraperSafe("courses", ctx, scrapeCourses, []);
    base.projects = await runScraperSafe("projects", ctx, scrapeProjects, []);
    base.skills = await runScraperSafe("skills", ctx, scrapeSkills, []);
    base.languages = await runScraperSafe("languages", ctx, scrapeLanguages, []);
    base.awards = await runScraperSafe("awards", ctx, scrapeAwards, []);
    base.volunteer = await runScraperSafe("volunteer", ctx, scrapeVolunteer, []);
    base.publications = await runScraperSafe("publications", ctx, scrapePublications, []);
    base.recommendationsCount = await runScraperSafe(
      "recommendations",
      ctx,
      scrapeRecommendationsCount,
      null
    );

    base.updatedAt = new Date().toISOString();

    const previous = await loadPreviousProfile(env.profileOutputPath);
    const merged = mergeIncremental(previous, base);
    const validated = validateProfile(merged);

    await saveProfile(env.profileOutputPath, validated);

    logger.info("Sync completed — site content is managed via npm run import-portfolio");
    if (validated._sync?.changes.length) {
      logger.info(`Changes: ${validated._sync.changes.join(", ")}`);
    }
  } finally {
    await closeSession(session);
  }
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
