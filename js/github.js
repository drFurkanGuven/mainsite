/**
 * GitHub public API client.
 * Rate limit: 60 req/h without token. Optional GITHUB_TOKEN for scripts only.
 */

const API_BASE = "https://api.github.com";
const LANG_COLORS = {
  Python: "#3572A5",
  TypeScript: "#3178C6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  "Jupyter Notebook": "#DA5B0B",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  Vue: "#41b883",
  default: "#737373",
};

/**
 * @param {string} username
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchUser(username) {
  const res = await fetch(`${API_BASE}/users/${username}`, {
    headers: acceptHeaders(),
  });
  if (!res.ok) throw new GitHubError("Kullanıcı bilgisi alınamadı", res.status);
  return res.json();
}

/**
 * @param {string} username
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function fetchRepos(username) {
  const res = await fetch(
    `${API_BASE}/users/${username}/repos?sort=updated&per_page=100&type=owner`,
    { headers: acceptHeaders() }
  );
  if (!res.ok) throw new GitHubError("Repolar alınamadı", res.status);
  return res.json();
}

/**
 * @param {string} username
 * @param {number} [perPage=8]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function fetchEvents(username, perPage = 8) {
  const res = await fetch(
    `${API_BASE}/users/${username}/events/public?per_page=${perPage}`,
    { headers: acceptHeaders() }
  );
  if (!res.ok) throw new GitHubError("Aktivite alınamadı", res.status);
  return res.json();
}

/**
 * @param {string} languagesUrl
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchLanguages(languagesUrl) {
  const res = await fetch(languagesUrl, { headers: acceptHeaders() });
  if (!res.ok) return {};
  return res.json();
}

/**
 * @param {string} username
 * @param {string[]} featuredNames
 * @param {string[]} excludeNames
 * @returns {Promise<{ featured: Array<Record<string, unknown>>, all: Array<Record<string, unknown>> }>}
 */
export async function getFeaturedRepos(username, featuredNames, excludeNames) {
  const repos = await fetchRepos(username);
  const exclude = new Set(excludeNames.map((n) => n.toLowerCase()));
  const filtered = repos.filter(
    (r) => !r.fork && !r.private && !exclude.has(String(r.name).toLowerCase())
  );

  const featuredSet = new Set(featuredNames.map((n) => n.toLowerCase()));
  const featured = featuredNames
    .map((name) => filtered.find((r) => r.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean);

  const remaining = filtered
    .filter((r) => !featuredSet.has(String(r.name).toLowerCase()))
    .sort((a, b) => Number(b.stargazers_count) - Number(a.stargazers_count))
    .slice(0, Math.max(0, 4 - featured.length));

  return { featured: [...featured, ...remaining].slice(0, 4), all: filtered };
}

/**
 * Aggregate language bytes across repos (top repos by stars).
 * @param {Array<Record<string, unknown>>} repos
 * @param {number} [limit=6]
 * @returns {Promise<Array<{ name: string, bytes: number, percent: number, color: string }>>}
 */
export async function aggregateLanguages(repos, limit = 6) {
  const top = [...repos]
    .sort((a, b) => Number(b.stargazers_count) - Number(a.stargazers_count))
    .slice(0, 8);

  /** @type {Record<string, number>} */
  const totals = {};

  await Promise.all(
    top.map(async (repo) => {
      const langs = await fetchLanguages(String(repo.languages_url));
      for (const [lang, bytes] of Object.entries(langs)) {
        totals[lang] = (totals[lang] || 0) + Number(bytes);
      }
    })
  );

  const totalBytes = Object.values(totals).reduce((a, b) => a + b, 0);
  if (totalBytes === 0) return [];

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: Math.round((bytes / totalBytes) * 100),
      color: LANG_COLORS[name] || LANG_COLORS.default,
    }));
}

/**
 * @param {Array<Record<string, unknown>>} events
 * @returns {Array<{ time: string, text: string, url: string|null }>}
 */
export function formatEvents(events) {
  return events
    .filter((e) => ["PushEvent", "PullRequestEvent", "CreateEvent", "WatchEvent"].includes(String(e.type)))
    .slice(0, 6)
    .map((event) => {
      const repo = String(event.repo?.name || "");
      const type = String(event.type);
      let text = "";
      let url = `https://github.com/${repo}`;

      if (type === "PushEvent") {
        const count = event.payload?.commits?.length || 0;
        text = `${repo} — ${count} commit push`;
      } else if (type === "PullRequestEvent") {
        const action = event.payload?.action || "update";
        text = `${repo} — PR ${action}`;
      } else if (type === "CreateEvent") {
        const refType = event.payload?.ref_type || "repo";
        text = `${repo} — ${refType} oluşturuldu`;
      } else if (type === "WatchEvent") {
        text = `${repo} — star`;
      }

      return {
        time: relativeTime(String(event.created_at)),
        text,
        url,
      };
    });
}

/**
 * @param {string} iso
 * @returns {string}
 */
export function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g`;
  const months = Math.floor(days / 30);
  return `${months}ay`;
}

/**
 * @returns {Record<string, string>}
 */
function acceptHeaders() {
  return { Accept: "application/vnd.github+json" };
}

export class GitHubError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   */
  constructor(message, status) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export { LANG_COLORS };
