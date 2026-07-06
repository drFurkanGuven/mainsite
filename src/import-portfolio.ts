import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { PortfolioData, SiteConfig } from "./models/portfolio.js";
import { mapPortfolioToSite } from "./utils/portfolio-mapper.js";
import { logger } from "./utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PORTFOLIO_PATH = resolve(ROOT, "data/portfolio.json");
const SITE_PATH = resolve(ROOT, "data/site.json");

async function main(): Promise<void> {
  logger.info("Importing portfolio.json → site.json");

  if (!existsSync(PORTFOLIO_PATH)) {
    throw new Error(`Portfolio not found: ${PORTFOLIO_PATH}`);
  }

  const portfolio = JSON.parse(await readFile(PORTFOLIO_PATH, "utf8")) as PortfolioData;

  let existing: SiteConfig | undefined;
  if (existsSync(SITE_PATH)) {
    existing = JSON.parse(await readFile(SITE_PATH, "utf8")) as SiteConfig;
  }

  const site = mapPortfolioToSite(portfolio, existing);

  await writeFile(SITE_PATH, JSON.stringify(site, null, 2) + "\n", "utf8");

  logger.info(`Updated ${SITE_PATH}`);
  logger.info(
    `  ${site.experience.length} experience · ${site.education.length} education · ` +
      `${site.certificates.length} certificates · ${site.projects.length} projects · ` +
      `${site.skills.length} skills`
  );
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
