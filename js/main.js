/**
 * Application entry point.
 */

import { loadProfile, applyMeta } from "./config.js";
import {
  getFeaturedRepos,
  fetchEvents,
  aggregateLanguages,
  formatEvents,
  GitHubError,
} from "./github.js";
import {
  renderHero,
  renderProjects,
  renderExperience,
  renderSkills,
  renderGitHubRepos,
  renderGitHubActivity,
  renderGitHubLanguages,
  renderNav,
  renderFooter,
} from "./render.js";
import { initNavigation } from "./navigation.js";

async function initGitHub(profile) {
  const { username, featuredRepos, excludeRepos } = profile.github;
  const reposEl = document.getElementById("github-repos");
  const activityEl = document.getElementById("github-activity");
  const langsEl = document.getElementById("github-languages");

  try {
    const [{ featured, all }, events] = await Promise.all([
      getFeaturedRepos(username, featuredRepos, excludeRepos),
      fetchEvents(username, 10),
    ]);

    const languages = await aggregateLanguages(all);

    renderGitHubRepos(featured);
    renderGitHubActivity(formatEvents(events));
    renderGitHubLanguages(languages);
  } catch (err) {
    const message =
      err instanceof GitHubError && err.status === 403
        ? "GitHub API limiti aşıldı. Bir süre sonra tekrar deneyin."
        : "GitHub verisi yüklenemedi.";

    for (const node of [reposEl, activityEl, langsEl]) {
      if (node) {
        node.textContent = message;
        node.className = "error";
      }
    }
  }
}

async function main() {
  try {
    const profile = await loadProfile();
    applyMeta(profile);
    renderNav(profile);
    renderHero(profile);
    renderProjects(profile);
    renderExperience(profile);
    renderSkills(profile);
    renderFooter(profile);
    initNavigation();

    await initGitHub(profile);
  } catch (err) {
    console.error(err);
    const main = document.getElementById("main-content");
    if (main) {
      const notice = document.createElement("p");
      notice.className = "error container";
      notice.textContent = "Site yüklenirken hata oluştu. Sayfayı yenileyin.";
      main.prepend(notice);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
