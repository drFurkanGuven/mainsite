/**
 * JSDoc type definitions for profile.json
 * @module data/profile.types
 */

/**
 * @typedef {Object} ProfileMeta
 * @property {string} siteUrl
 * @property {string} title
 * @property {string} description
 */

/**
 * @typedef {Object} ProfileIdentity
 * @property {string} name
 * @property {string} headline
 * @property {string} [location]
 */

/**
 * @typedef {Object} ProfileLinks
 * @property {{ url: string, username: string }} github
 * @property {{ url: string }} linkedin
 * @property {string|null} email
 */

/**
 * @typedef {Object} GitHubConfig
 * @property {string} username
 * @property {string[]} featuredRepos
 * @property {string[]} excludeRepos
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string|null} url
 * @property {string|null} repo
 * @property {string[]} stack
 */

/**
 * @typedef {Object} ExperienceItem
 * @property {string} period
 * @property {string} title
 * @property {string} role
 * @property {string} description
 * @property {string[]} [items]
 */

/**
 * @typedef {Object} EducationItem
 * @property {string} period
 * @property {string} title
 * @property {string} institution
 */

/**
 * @typedef {Object} CertificateItem
 * @property {string} period
 * @property {string} title
 */

/**
 * @typedef {Object} LinkedInConfig
 * @property {boolean} syncEnabled
 * @property {string|null} lastSynced
 * @property {string} source
 * @property {string} [syncNote]
 */

/**
 * @typedef {Object} Profile
 * @property {ProfileMeta} meta
 * @property {ProfileIdentity} identity
 * @property {ProfileLinks} links
 * @property {GitHubConfig} github
 * @property {Project[]} projects
 * @property {ExperienceItem[]} experience
 * @property {EducationItem[]} education
 * @property {CertificateItem[]} certificates
 * @property {string[]} skills
 * @property {LinkedInConfig} linkedin
 */

export {};
