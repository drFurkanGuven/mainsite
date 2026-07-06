/**
 * DOM rendering utilities.
 */

/**
 * @param {string} tag
 * @param {Record<string, string|null|undefined>} [attrs]
 * @param {(Node|string|null)[]} [children]
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === "className") node.className = value;
    else if (key === "textContent") node.textContent = value;
    else if (key === "innerHTML") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === "string") node.appendChild(document.createTextNode(child));
    else if (child) node.appendChild(child);
  }
  return node;
}

/**
 * @param {string} href
 * @param {string} label
 * @param {boolean} [external=false]
 * @returns {HTMLAnchorElement}
 */
export function link(href, label, external = false) {
  const a = el("a", {
    href,
    textContent: label,
    ...(external ? { target: "_blank", rel: "noopener noreferrer", "data-external": "true" } : {}),
  });
  if (external) a.setAttribute("aria-label", `${label} (yeni sekme)`);
  return a;
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function renderHero(profile) {
  const root = document.getElementById("hero");
  if (!root) return;

  const links = [];
  if (profile.links.github?.url) {
    links.push(el("li", {}, [link(profile.links.github.url, "GitHub", true)]));
  }
  if (profile.links.linkedin?.url) {
    links.push(el("li", {}, [link(profile.links.linkedin.url, "LinkedIn", true)]));
  }
  const klinikiq = profile.projects.find((p) => p.id === "klinikiq");
  if (klinikiq?.url) {
    links.push(el("li", {}, [link(klinikiq.url, "KlinikIQ", true)]));
  }

  root.replaceChildren(
    el("div", { className: "container container--narrow fade-in" }, [
      el("h1", { className: "hero__name", textContent: profile.identity.name }),
      el("p", { className: "hero__headline", textContent: profile.identity.headline }),
      profile.identity.location
        ? el("p", { className: "hero__meta", textContent: profile.identity.location })
        : null,
      el("ul", { className: "hero__links", role: "list" }, links),
    ].filter(Boolean))
  );
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function renderProjects(profile) {
  const root = document.getElementById("projects-list");
  if (!root) return;

  const items = profile.projects.map((project) => {
    const title = project.url
      ? link(project.url, project.name, true)
      : el("span", { textContent: project.name });

    const titleWrap = el("h3", { className: "list-item__title" });
    titleWrap.appendChild(title);

    const children = [
      el("div", { className: "list-item__header" }, [titleWrap]),
      el("p", { className: "list-item__desc", textContent: project.description }),
    ];

    if (project.stack?.length) {
      children.push(
        el("ul", { className: "tags", role: "list" },
          project.stack.map((s) => el("li", { className: "tag", textContent: s }))
        )
      );
    }

    if (project.repo && profile.links.github?.url) {
      const repoUrl = `${profile.links.github.url}/${project.repo}`;
      children.push(
        el("p", { className: "list-item__subtitle" }, [
          link(repoUrl, `${profile.github.username}/${project.repo}`, true),
        ])
      );
    }

    return el("li", { className: "list-item" }, children);
  });

  root.replaceChildren(el("ul", { className: "list", role: "list" }, items));
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function renderExperience(profile) {
  const root = document.getElementById("experience-list");
  if (!root) return;

  const items = [];

  for (const exp of profile.experience) {
    items.push(
      el("li", { className: "list-item" }, [
        el("div", { className: "list-item__header" }, [
          el("h3", { className: "list-item__title", textContent: exp.title }),
          el("time", { className: "list-item__period", textContent: exp.period }),
        ]),
        el("p", { className: "list-item__subtitle", textContent: exp.role }),
        el("p", { className: "list-item__desc", textContent: exp.description }),
        exp.items?.length
          ? el("ul", { className: "list-item__bullets" }, exp.items.map((i) => el("li", { textContent: i })))
          : null,
      ].filter(Boolean))
    );
  }

  for (const edu of profile.education) {
    items.push(
      el("li", { className: "list-item" }, [
        el("div", { className: "list-item__header" }, [
          el("h3", { className: "list-item__title", textContent: edu.title }),
          el("time", { className: "list-item__period", textContent: edu.period }),
        ]),
        el("p", { className: "list-item__subtitle", textContent: edu.institution }),
      ])
    );
  }

  for (const cert of profile.certificates) {
    items.push(
      el("li", { className: "list-item" }, [
        el("div", { className: "list-item__header" }, [
          el("h3", { className: "list-item__title", textContent: cert.title }),
          el("time", { className: "list-item__period", textContent: cert.period }),
        ]),
      ])
    );
  }

  root.replaceChildren(el("ul", { className: "list", role: "list" }, items));
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function renderSkills(profile) {
  const root = document.getElementById("skills-list");
  if (!root) return;

  root.replaceChildren(
    el("ul", { className: "skills", role: "list" },
      profile.skills.map((s) => el("li", { textContent: s }))
    )
  );
}

/**
 * @param {Array<Record<string, unknown>>} repos
 */
export function renderGitHubRepos(repos) {
  const root = document.getElementById("github-repos");
  if (!root) return;

  if (!repos.length) {
    root.textContent = "Repo bulunamadı.";
    root.className = "error";
    return;
  }

  const cards = repos.map((repo) => {
    const name = String(repo.name);
    const url = String(repo.html_url);
    const desc = repo.description ? String(repo.description) : "Açıklama yok";
    const stars = Number(repo.stargazers_count) || 0;
    const updated = formatDate(String(repo.updated_at));

    return el("article", { className: "repo-card" }, [
      el("a", {
        className: "repo-card__link",
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${name} reposu (yeni sekme)`,
        "data-external": "true",
      }, [
        el("h3", { className: "repo-card__name", textContent: name }),
        el("p", { className: "repo-card__desc", textContent: desc }),
        el("p", { className: "repo-card__meta", textContent: `★ ${stars} · ${updated}` }),
      ]),
    ]);
  });

  root.replaceChildren(el("div", { role: "list" }, cards));
}

/**
 * @param {Array<{ time: string, text: string, url: string|null }>} activities
 */
export function renderGitHubActivity(activities) {
  const root = document.getElementById("github-activity");
  if (!root) return;

  if (!activities.length) {
    root.textContent = "Son aktivite yok.";
    root.className = "error";
    return;
  }

  const items = activities.map((a) =>
    el("li", { className: "activity-item" }, [
      el("span", { className: "activity-item__time", textContent: a.time }),
      a.url
        ? el("a", { href: a.url, target: "_blank", rel: "noopener noreferrer", textContent: a.text })
        : el("span", { textContent: a.text }),
    ])
  );

  root.replaceChildren(el("ul", { className: "list", role: "list" }, items));
}

/**
 * @param {Array<{ name: string, percent: number, color: string }>} languages
 */
export function renderGitHubLanguages(languages) {
  const root = document.getElementById("github-languages");
  if (!root) return;

  if (!languages.length) {
    root.textContent = "Dil verisi yok.";
    root.className = "error";
    return;
  }

  const bar = el("div", {
    className: "lang-bar",
    role: "img",
    "aria-label": languages.map((l) => `${l.name} ${l.percent}%`).join(", "),
  });

  for (const lang of languages) {
    bar.appendChild(el("span", {
      className: "lang-bar__segment",
      style: `width:${lang.percent}%;background:${lang.color}`,
    }));
  }

  const legend = el("ul", { className: "lang-legend", role: "list" },
    languages.map((l) =>
      el("li", {}, [
        el("span", { className: "lang-legend__dot", style: `background:${l.color}` }),
        document.createTextNode(`${l.name} ${l.percent}%`),
      ])
    )
  );

  root.replaceChildren(bar, legend);
}

/**
 * @param {string} iso
 */
function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function renderNav(profile) {
  const logo = document.querySelector(".site-logo");
  if (logo) logo.textContent = profile.identity.name;
}

/**
 * @param {import('../data/profile.types.js').Profile} profile
 */
export function renderFooter(profile) {
  const root = document.getElementById("footer-text");
  if (!root) return;
  root.textContent = `© ${new Date().getFullYear()} ${profile.identity.name}`;
}
