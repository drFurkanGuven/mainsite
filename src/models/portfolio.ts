export interface PortfolioProfile {
  name: string;
  title: string;
  location: { city: string; hometown?: string; country: string };
  about: string;
  socials: { linkedin?: string; github?: string; website?: string };
}

export interface PortfolioExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location?: string;
  type?: string;
  description: string;
  skills?: string[];
}

export interface PortfolioEducation {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface PortfolioCertification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  url?: string;
  description: string;
  techStack: string[];
}

export interface PortfolioData {
  profile: PortfolioProfile;
  experience: PortfolioExperience[];
  education: PortfolioEducation[];
  certifications: PortfolioCertification[];
  projects: PortfolioProject[];
  skills: Record<string, string[]>;
}

export interface SiteConfig {
  meta: { siteUrl: string; title: string; description: string };
  identity: { name: string; headline: string; about?: string; location: string };
  links: {
    github: { url: string; username: string };
    linkedin: { url: string };
    email: string | null;
  };
  github: { username: string; featuredRepos: string[]; excludeRepos: string[] };
  projects: Array<{
    id: string;
    name: string;
    description: string;
    url: string | null;
    repo: string | null;
    stack: string[];
  }>;
  experience: Array<{
    period: string;
    title: string;
    role: string;
    description: string;
    items?: string[];
  }>;
  education: Array<{ period: string; title: string; institution: string }>;
  certificates: Array<{ period: string; title: string }>;
  skills: string[];
  linkedin: {
    syncEnabled: boolean;
    lastSynced: string | null;
    source: string;
    portfolioPath?: string;
    profilePath?: string;
  };
}
