import type {
  PortfolioData,
  PortfolioProject,
  SiteConfig,
} from "../models/portfolio.js";

const LINKEDIN_URL = "https://www.linkedin.com/in/furkan-g%C3%BCven-933647216";
const GITHUB_URL = "https://github.com/drFurkanGuven";
const GITHUB_USER = "drFurkanGuven";
const SITE_URL = "https://furkanguven.space";

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const PROJECT_OVERRIDES: Record<string, Partial<SiteConfig["projects"][0]>> = {
  klinikiq: {
    description:
      "Tıp öğrencileri için vaka simülasyonu. FastAPI backend, Next.js frontend, React Native mobil uygulama.",
    url: "https://klinikiq.furkanguven.space",
    repo: "klinikiq",
    stack: ["Python", "FastAPI", "Next.js", "PostgreSQL", "Docker", "React Native"],
  },
};

export function mapPortfolioToSite(portfolio: PortfolioData, existing?: SiteConfig): SiteConfig {
  const { profile } = portfolio;
  const location = [profile.location.city, profile.location.country].filter(Boolean).join(", ");

  const headline =
    "Fırat Üniversitesi Tıp Fakültesi, 3. dönem. FastAPI, Next.js, sağlık teknolojileri.";

  const metaDescription =
    "Tıp öğrencisi. FastAPI, Next.js ve React Native. KlinikIQ, Linux, nöromorfik sistemler.";

  return {
    meta: {
      siteUrl: existing?.meta.siteUrl ?? SITE_URL,
      title: profile.name,
      description: metaDescription,
    },
    identity: {
      name: profile.name,
      headline,
      about: trimAbout(profile.about),
      location,
      photo: existing?.identity.photo ?? "assets/photo.jpeg",
    },
    links: {
      github: { url: GITHUB_URL, username: GITHUB_USER },
      linkedin: { url: LINKEDIN_URL },
      email: existing?.links.email ?? null,
    },
    github: existing?.github ?? {
      username: GITHUB_USER,
      featuredRepos: ["klinikiq"],
      excludeRepos: [],
    },
    projects: portfolio.projects.map(mapProject),
    experience: portfolio.experience.map(mapExperience),
    education: portfolio.education.map(mapEducation),
    certificates: portfolio.certifications.map(mapCertificate),
    skills: mapSkills(portfolio.skills),
    linkedin: {
      syncEnabled: false,
      lastSynced: new Date().toISOString(),
      source: "portfolio.json",
      portfolioPath: "./data/portfolio.json",
    },
  };
}

function trimAbout(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function formatPeriod(start: string, end: string): string {
  const startFmt = formatDate(start);
  if (!end || /^present$/i.test(end)) return `${startFmt} —`;
  return `${startFmt} — ${formatDate(end)}`;
}

function formatDate(value: string): string {
  if (!value) return "";
  if (/^\d{4}$/.test(value)) return value;
  const [year, month] = value.split("-");
  if (!month) return year;
  const idx = parseInt(month, 10) - 1;
  return idx >= 0 && idx < 12 ? `${MONTHS_TR[idx]} ${year}` : year;
}

function mapExperience(exp: PortfolioData["experience"][0]) {
  return {
    period: formatPeriod(exp.startDate, exp.endDate),
    title: exp.company,
    role: exp.role,
    description: exp.description.trim(),
    items: [
      ...(exp.type ? [exp.type] : []),
      ...(exp.location ? [exp.location] : []),
      ...(exp.skills?.slice(0, 4) ?? []),
    ].filter(Boolean),
  };
}

function mapEducation(edu: PortfolioData["education"][0]) {
  return {
    period: formatPeriod(edu.startDate, edu.endDate),
    title: simplifyDegree(edu.degree),
    institution: edu.institution,
  };
}

function simplifyDegree(degree: string): string {
  if (/doctor of medicine|medicine/i.test(degree)) return "Tıp Doktoru (MD)";
  return degree;
}

function mapCertificate(cert: PortfolioData["certifications"][0]) {
  const title = cert.title.split(" / ")[0]?.trim() || cert.title;
  return {
    period: formatDate(cert.issueDate),
    title,
  };
}

function projectId(project: PortfolioProject): string {
  if (/klinikiq/i.test(project.title)) return "klinikiq";
  if (/bkzs|anti-spoofing/i.test(project.title)) return "bkzs";
  const fromId = project.id.replace(/^proj-/, "");
  if (fromId && !/^\d+$/.test(fromId)) return fromId;
  return project.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "project";
}

function mapProject(project: PortfolioProject): SiteConfig["projects"][0] {
  const id = projectId(project);
  const base = {
    id,
    name: project.title,
    description: project.description.trim(),
    url: normalizeUrl(project.url),
    repo: id === "klinikiq" ? "klinikiq" : null,
    stack: [...project.techStack],
  };

  const override = PROJECT_OVERRIDES[id];
  return override ? { ...base, ...override } : base;
}

function normalizeUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://${url.replace(/^\/\//, "")}`;
}

function mapSkills(skills: Record<string, string[]>): string[] {
  const merged = [
    ...(skills.software_and_engineering ?? []),
    ...(skills.medical_and_clinical ?? []).slice(0, 4),
    ...(skills.science_and_astrophysics ?? []).slice(0, 3),
  ];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of merged) {
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return result.slice(0, 16);
}
