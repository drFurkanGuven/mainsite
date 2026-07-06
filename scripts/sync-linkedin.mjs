#!/usr/bin/env node
/**
 * LinkedIn → profile.json birleştirme aracı.
 *
 * LinkedIn API genel profil verisine kapalı olduğu için deneyim/eğitim
 * manuel olarak data/linkedin-export.json dosyasına yazılır veya
 * periyodik olarak dış kaynaktan export alınır.
 *
 * Kullanım:
 *   node scripts/sync-linkedin.mjs
 *   node scripts/sync-linkedin.mjs --input data/linkedin-export.json
 *
 * Cron örneği (ayda bir):
 *   0 9 1 * * cd /var/www/furkanguven/FurkanSpace && node scripts/sync-linkedin.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PROFILE_PATH = resolve(ROOT, "data/profile.json");
const DEFAULT_EXPORT = resolve(ROOT, "data/linkedin-export.json");

/**
 * @typedef {Object} LinkedInExport
 * @property {Array<{ period: string, title: string, role: string, description: string, items?: string[] }>} [experience]
 * @property {Array<{ period: string, title: string, institution: string }>} [education]
 * @property {Array<{ period: string, title: string }>} [certificates]
 */

function parseArgs() {
  const inputIdx = process.argv.indexOf("--input");
  return {
    inputPath: inputIdx !== -1 ? resolve(process.argv[inputIdx + 1]) : DEFAULT_EXPORT,
  };
}

async function main() {
  const { inputPath } = parseArgs();

  const [profileRaw, exportRaw] = await Promise.all([
    readFile(PROFILE_PATH, "utf8"),
    readFile(inputPath, "utf8").catch(() => null),
  ]);

  if (!exportRaw) {
    console.log(`Export dosyası yok: ${inputPath}`);
    console.log("Örnek yapı için data/linkedin-export.example.json dosyasına bakın.");
    process.exit(0);
  }

  /** @type {Record<string, unknown>} */
  const profile = JSON.parse(profileRaw);
  /** @type {LinkedInExport} */
  const linkedinData = JSON.parse(exportRaw);

  if (linkedinData.experience?.length) {
    profile.experience = linkedinData.experience;
  }
  if (linkedinData.education?.length) {
    profile.education = linkedinData.education;
  }
  if (linkedinData.certificates?.length) {
    profile.certificates = linkedinData.certificates;
  }

  profile.linkedin = {
    ...profile.linkedin,
    syncEnabled: true,
    lastSynced: new Date().toISOString(),
    source: "linkedin-export.json",
  };

  await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2) + "\n", "utf8");
  console.log(`profile.json güncellendi (${profile.linkedin.lastSynced})`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
