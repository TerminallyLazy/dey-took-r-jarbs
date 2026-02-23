import axios from "axios";
import { prisma } from "./prisma";
import type { ScrapedJob, ScrapeResult } from "@/types";

const JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search";

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_employment_type: string | null;
  job_apply_link: string;
  job_description: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string | null;
  job_city: string | null;
  job_state: string | null;
  job_country: string | null;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_required_skills: string[] | null;
  job_highlights: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  } | null;
  job_google_link: string | null;
}

interface JSearchResponse {
  status: string;
  data: JSearchJob[];
}

function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error("RAPIDAPI_KEY environment variable is not set. Get a free key at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch");
  }
  return key;
}

function buildLocation(city: string, state: string | null, country: string | null): string {
  const parts = [city, state, country].filter(Boolean);
  return parts.join(", ");
}

function formatSalaryString(job: JSearchJob): string | undefined {
  if (!job.job_min_salary && !job.job_max_salary) return undefined;
  const period = job.job_salary_period?.toLowerCase() || "year";
  const currency = job.job_salary_currency || "USD";
  const symbol = currency === "USD" ? "$" : currency;

  if (job.job_min_salary && job.job_max_salary) {
    return `${symbol}${job.job_min_salary.toLocaleString()} - ${symbol}${job.job_max_salary.toLocaleString()} per ${period}`;
  }
  if (job.job_min_salary) {
    return `${symbol}${job.job_min_salary.toLocaleString()}+ per ${period}`;
  }
  return `Up to ${symbol}${job.job_max_salary!.toLocaleString()} per ${period}`;
}

function normalizeToYearly(amount: number | null, period: string | null): number | undefined {
  if (!amount) return undefined;
  switch (period?.toUpperCase()) {
    case "HOUR":
      return amount * 2080;
    case "MONTH":
      return amount * 12;
    case "WEEK":
      return amount * 52;
    case "YEAR":
    default:
      return amount;
  }
}

function mapJSearchJob(job: JSearchJob): ScrapedJob {
  const location = buildLocation(
    job.job_city || "",
    job.job_state,
    job.job_country
  );

  return {
    externalId: `jsearch_${job.job_id}`,
    title: job.job_title,
    company: job.employer_name,
    location,
    salary: formatSalaryString(job),
    salaryMin: normalizeToYearly(job.job_min_salary, job.job_salary_period),
    salaryMax: normalizeToYearly(job.job_max_salary, job.job_salary_period),
    description: job.job_description || "No description available",
    url: job.job_apply_link || job.job_google_link || "",
    source: "jsearch",
    postedDate: job.job_posted_at_datetime_utc
      ? new Date(job.job_posted_at_datetime_utc)
      : undefined,
    applicantCount: undefined,
    jobType: job.job_employment_type || undefined,
    remote: job.job_is_remote || false,
    skills: job.job_required_skills || [],
  };
}

async function fetchJSearchPage(
  query: string,
  location: string,
  page: number
): Promise<JSearchJob[]> {
  const response = await axios.get<JSearchResponse>(JSEARCH_BASE_URL, {
    headers: {
      "X-RapidAPI-Key": getApiKey(),
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
    params: {
      query: `${query} in ${location}`,
      page: (page + 1).toString(), // JSearch uses 1-based pages
      num_pages: "1",
      date_posted: "today",
    },
    timeout: 30000,
  });

  if (response.data.status !== "OK") {
    throw new Error(`JSearch API returned status: ${response.data.status}`);
  }

  return response.data.data || [];
}

export async function scrapeIndeedJobs(
  query: string,
  location: string,
  pages: number = 2
): Promise<ScrapeResult> {
  const log = await prisma.scrapeLog.create({
    data: { query, location },
  });

  let allJobs: ScrapedJob[] = [];
  const errors: string[] = [];

  for (let page = 0; page < pages; page++) {
    try {
      const jobs = await fetchJSearchPage(query, location, page);
      const mapped = jobs.map(mapJSearchJob);
      allJobs = allJobs.concat(mapped);

      // Rate limit between pages
      if (page < pages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Page ${page}: ${msg}`);
    }
  }

  // Deduplicate within this batch
  const seen = new Set<string>();
  allJobs = allJobs.filter((job) => {
    if (seen.has(job.externalId)) return false;
    seen.add(job.externalId);
    return true;
  });

  let newJobs = 0;
  let duplicates = 0;

  for (const job of allJobs) {
    try {
      const existing = await prisma.job.findUnique({
        where: { externalId: job.externalId },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      await prisma.job.create({
        data: {
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          description: job.description,
          url: job.url,
          source: job.source,
          postedDate: job.postedDate,
          applicantCount: job.applicantCount,
          jobType: job.jobType,
          remote: job.remote,
          skills: job.skills ? JSON.stringify(job.skills) : null,
          isNew: true,
        },
      });

      newJobs++;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        duplicates++;
      } else {
        errors.push(`Save ${job.externalId}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }

  await prisma.scrapeLog.update({
    where: { id: log.id },
    data: {
      jobsFound: allJobs.length,
      newJobs,
      duplicates,
      errors: errors.length > 0 ? errors.join("; ") : null,
      completedAt: new Date(),
    },
  });

  return {
    query,
    location,
    jobsFound: allJobs.length,
    newJobs,
    duplicates,
    errors: errors.length > 0 ? errors.join("; ") : undefined,
  };
}
