/**
 * Profile configuration loader.
 * Single source of truth: data/profile.json
 */

const PROFILE_PATH = "./data/profile.json";

/** @type {import('../data/profile.types.js').Profile | null} */
let cachedProfile = null;

/**
 * @returns {Promise<import('../data/profile.types.js').Profile>}
 */
export async function loadProfile() {
  if (cachedProfile) return cachedProfile;

  const response = await fetch(PROFILE_PATH, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Profil yüklenemedi (${response.status})`);
  }

  cachedProfile = await response.json();
  return cachedProfile;
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function applyMeta(profile) {
  document.title = profile.meta.title;

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", profile.meta.description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", profile.meta.siteUrl);

  const jsonLd = document.getElementById("json-ld");
  if (jsonLd) {
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.identity.name,
      url: profile.meta.siteUrl,
      jobTitle: profile.identity.headline,
      sameAs: [
        profile.links.github.url,
        profile.links.linkedin.url,
      ].filter(Boolean),
    });
  }
}

export function getProfile() {
  if (!cachedProfile) throw new Error("Profil henüz yüklenmedi");
  return cachedProfile;
}
