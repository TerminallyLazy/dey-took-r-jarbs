import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "./prisma";
import type { ScrapedJob, ScrapeResult } from "@/types";
import { parseSalary } from "./utils";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function buildIndeedUrl(query: string, location: string, start: number = 0): string {
  const params = new URLSearchParams({
    q: query,
    l: location,
    sort: "date",
    start: start.toString(),
    fromage: "1", // Last 24 hours
  });
  return `https://www.indeed.com/jobs?${params.toString()}`;
}

async function fetchPage(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": getRandomUA(),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
    timeout: 15000,
  });
  return response.data;
}

function parseIndeedListings(html: string): ScrapedJob[] {
  const $ = cheerio.load(html);
  const jobs: ScrapedJob[] = [];

  // Indeed embeds job data in script tags as JSON
  $("script").each((_i, el) => {
    const text = $(el).html() || "";
    if (text.includes("mosaic-provider-jobcards")) {
      try {
        const match = text.match(/window\.mosaic\.providerData\["mosaic-provider-jobcards"\]\s*=\s*({[\s\S]+?});/);
        if (match) {
          const data = JSON.parse(match[1]);
          const results = data?.metaData?.mosaicProviderJobCardsModel?.results || [];
          for (const job of results) {
            jobs.push(parseJobFromData(job));
          }
        }
      } catch {
        // Fall through to HTML parsing
      }
    }
  });

  // Fallback: parse HTML cards directly
  if (jobs.length === 0) {
    $(".job_seen_beacon, .jobsearch-ResultsList > li, .resultContent, [data-jk]").each((_i, el) => {
      const $el = $(el);
      const jk = $el.attr("data-jk") || $el.find("[data-jk]").attr("data-jk") || "";
      if (!jk) return;

      const title = $el.find(".jobTitle span, h2.jobTitle a span").first().text().trim();
      const company = $el.find("[data-testid='company-name'], .companyName, .company").first().text().trim();
      const location = $el.find("[data-testid='text-location'], .companyLocation, .location").first().text().trim();
      const salary = $el.find(".salary-snippet-container, .salaryText, [data-testid='attribute_snippet_testid']").first().text().trim();
      const snippet = $el.find(".job-snippet, .jobCardShelfContainer, .underShelfFooter").first().text().trim();
      const metadata = $el.find(".metadata, .jobMetaDataGroup").text().trim();

      if (title && company) {
        const salaryParsed = salary ? parseSalary(salary) : {};
        jobs.push({
          externalId: `indeed_${jk}`,
          title,
          company,
          location,
          salary: salary || undefined,
          salaryMin: salaryParsed.min,
          salaryMax: salaryParsed.max,
          description: snippet || metadata || "No description available",
          url: `https://www.indeed.com/viewjob?jk=${jk}`,
          source: "indeed",
          postedDate: extractPostedDate($el.find(".date, .myJobsState").text()),
          applicantCount: extractApplicantCount($el.text()),
          jobType: extractJobType($el.text()),
          remote: /remote|work from home|wfh/i.test(location + " " + title),
          skills: [],
        });
      }
    });
  }

  return jobs;
}

function parseJobFromData(job: Record<string, unknown>): ScrapedJob {
  const salary = (job.formattedSalary as string) || (job.extractedSalary as Record<string, unknown>)?.max
    ? `$${(job.extractedSalary as Record<string, unknown>)?.min || ""}–$${(job.extractedSalary as Record<string, unknown>)?.max || ""}`
    : undefined;

  const salaryParsed = salary ? parseSalary(salary) : {};
  const locationStr = (job.formattedLocation as string) || (job.jobLocationCity as string) || "";

  return {
    externalId: `indeed_${job.jobkey || job.jk}`,
    title: (job.title as string) || (job.displayTitle as string) || "",
    company: (job.company as string) || "",
    location: locationStr,
    salary,
    salaryMin: salaryParsed.min || (job.extractedSalary as Record<string, unknown>)?.min as number | undefined,
    salaryMax: salaryParsed.max || (job.extractedSalary as Record<string, unknown>)?.max as number | undefined,
    description: (job.snippet as string) || "",
    url: `https://www.indeed.com/viewjob?jk=${job.jobkey || job.jk}`,
    source: "indeed",
    postedDate: job.formattedRelativeDate ? extractPostedDate(job.formattedRelativeDate as string) : undefined,
    applicantCount: (job.applicantCount as string) || undefined,
    jobType: (job.jobTypes as string[])?.join(", ") || undefined,
    remote: /remote/i.test(locationStr + " " + ((job.title as string) || "")),
    skills: [],
  };
}

function extractPostedDate(text: string): Date | undefined {
  if (!text) return undefined;
  const now = new Date();
  const lower = text.toLowerCase();

  if (lower.includes("just posted") || lower.includes("today")) return now;

  const daysMatch = lower.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    return new Date(now.getTime() - days * 86400000);
  }

  const hoursMatch = lower.match(/(\d+)\s*hour/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    return new Date(now.getTime() - hours * 3600000);
  }

  return undefined;
}

function extractApplicantCount(text: string): string | undefined {
  const match = text.match(/(\d+\+?\s*applicants?|be\s+(?:an?\s+)?early\s+applicant)/i);
  return match ? match[0].trim() : undefined;
}

function extractJobType(text: string): string | undefined {
  const types = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"];
  for (const type of types) {
    if (text.toLowerCase().includes(type.toLowerCase())) return type;
  }
  return undefined;
}

async function fetchJobDetails(url: string): Promise<string> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const description =
      $("#jobDescriptionText").text().trim() ||
      $("[id*='jobDescription']").text().trim() ||
      $(".jobsearch-jobDescriptionText").text().trim();
    return description || "No detailed description available";
  } catch {
    return "Unable to fetch detailed description";
  }
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
      const url = buildIndeedUrl(query, location, page * 10);
      const html = await fetchPage(url);
      const jobs = parseIndeedListings(html);
      allJobs = allJobs.concat(jobs);

      // Rate limit between pages
      if (page < pages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));
      }
    } catch (error) {
      errors.push(`Page ${page}: ${error instanceof Error ? error.message : "Unknown error"}`);
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

      // Fetch full description for new jobs
      let fullDescription = job.description;
      try {
        const details = await fetchJobDetails(job.url);
        if (details && details !== "Unable to fetch detailed description") {
          fullDescription = details;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
      } catch {
        // Keep the snippet description
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
          description: fullDescription,
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
