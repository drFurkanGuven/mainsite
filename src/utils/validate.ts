import { LinkedInProfileSchema, type LinkedInProfile } from "../models/profile.js";
import { createLogger } from "./logger.js";

const log = createLogger("validate");

export function validateProfile(profile: LinkedInProfile): LinkedInProfile {
  const result = LinkedInProfileSchema.safeParse(profile);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    log.error(`Validation failed:\n  ${issues.join("\n  ")}`);
    throw new Error("Generated profile failed validation");
  }

  log.info("Profile validation passed");
  return result.data;
}
