import { z } from "zod";

export const PersonalSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  about: z.string(),
  location: z.string(),
  profilePhotoUrl: z.string().nullable(),
});

export const ExperienceSchema = z.object({
  company: z.string(),
  position: z.string(),
  employmentType: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  current: z.boolean(),
  description: z.string(),
  companyLogoUrl: z.string().nullable(),
});

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuingOrganization: z.string(),
  issueDate: z.string().nullable(),
  expirationDate: z.string().nullable(),
  credentialId: z.string().nullable(),
  credentialUrl: z.string().nullable(),
});

export const CourseSchema = z.object({
  name: z.string(),
  provider: z.string(),
  date: z.string().nullable(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

export const SkillSchema = z.object({
  name: z.string(),
  endorsementCount: z.number().nullable(),
});

export const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z.string(),
});

export const AwardSchema = z.object({
  title: z.string(),
  issuer: z.string(),
  date: z.string().nullable(),
  description: z.string(),
});

export const VolunteerSchema = z.object({
  organization: z.string(),
  role: z.string(),
  cause: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string(),
});

export const PublicationSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  date: z.string().nullable(),
  url: z.string().nullable(),
  description: z.string(),
});

export const SyncMetaSchema = z.object({
  changes: z.array(z.string()),
  previousUpdatedAt: z.string().nullable(),
});

export const LinkedInProfileSchema = z.object({
  updatedAt: z.string(),
  personal: PersonalSchema,
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  certifications: z.array(CertificationSchema),
  courses: z.array(CourseSchema),
  projects: z.array(ProjectSchema),
  skills: z.array(SkillSchema),
  languages: z.array(LanguageSchema),
  awards: z.array(AwardSchema),
  volunteer: z.array(VolunteerSchema),
  publications: z.array(PublicationSchema),
  recommendationsCount: z.number().nullable(),
  _sync: SyncMetaSchema.optional(),
});

export type Personal = z.infer<typeof PersonalSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Award = z.infer<typeof AwardSchema>;
export type Volunteer = z.infer<typeof VolunteerSchema>;
export type Publication = z.infer<typeof PublicationSchema>;
export type SyncMeta = z.infer<typeof SyncMetaSchema>;
export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;

export function emptyProfile(): LinkedInProfile {
  return {
    updatedAt: new Date().toISOString(),
    personal: {
      fullName: "",
      headline: "",
      about: "",
      location: "",
      profilePhotoUrl: null,
    },
    experience: [],
    education: [],
    certifications: [],
    courses: [],
    projects: [],
    skills: [],
    languages: [],
    awards: [],
    volunteer: [],
    publications: [],
    recommendationsCount: null,
  };
}
