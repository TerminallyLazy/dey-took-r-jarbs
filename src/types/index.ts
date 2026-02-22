export interface ScrapedJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  url: string;
  source: string;
  postedDate?: Date;
  applicantCount?: string;
  jobType?: string;
  remote: boolean;
  skills?: string[];
}

export interface JobWithRelations {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  summary: string | null;
  url: string;
  source: string;
  postedDate: Date | null;
  scrapedAt: Date;
  applicantCount: string | null;
  jobType: string | null;
  remote: boolean;
  confidenceScore: number | null;
  skills: string | null;
  isNew: boolean;
  isHidden: boolean;
  application: ApplicationData | null;
  coverLetters: CoverLetterData[];
}

export interface ApplicationData {
  id: string;
  jobId: string;
  status: string;
  appliedDate: Date | null;
  notes: string | null;
  resumeUsed: string | null;
  followUpDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetterData {
  id: string;
  jobId: string;
  content: string;
  tone: string;
  version: number;
  createdAt: Date;
}

export interface ScrapeResult {
  query: string;
  location: string;
  jobsFound: number;
  newJobs: number;
  duplicates: number;
  errors?: string;
}

export type ApplicationStatus =
  | "interested"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

export type CoverLetterTone = "professional" | "enthusiastic" | "technical";

export interface DashboardStats {
  totalJobs: number;
  newJobs: number;
  applied: number;
  interviewing: number;
  offered: number;
  rejected: number;
  avgConfidence: number;
  lastScrape: Date | null;
}
