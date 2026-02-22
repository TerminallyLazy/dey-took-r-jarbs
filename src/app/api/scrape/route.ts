import { NextRequest, NextResponse } from "next/server";
import { scrapeIndeedJobs } from "@/lib/scraper";
import { analyzeMultipleJobs } from "@/lib/anthropic";
import { sendNewJobsNotification } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, location, pages = 2, analyze = true, notify = true } = body;

  if (!query || !location) {
    return NextResponse.json(
      { error: "Query and location are required" },
      { status: 400 }
    );
  }

  const result = await scrapeIndeedJobs(query, location, pages);

  // If new jobs were found, analyze them and send notifications
  if (result.newJobs > 0 && (analyze || notify)) {
    const newJobs = await prisma.job.findMany({
      where: { isNew: true, confidenceScore: null },
      orderBy: { scrapedAt: "desc" },
      take: result.newJobs,
    });

    if (analyze && newJobs.length > 0) {
      const jobIds = newJobs.map((j) => j.id);
      // Run analysis in background - don't block the response
      analyzeMultipleJobs(jobIds).catch(console.error);
    }

    if (notify && newJobs.length > 0) {
      sendNewJobsNotification(
        newJobs.map((j) => ({
          title: j.title,
          company: j.company,
          location: j.location,
          salary: j.salary,
          url: j.url,
          confidenceScore: j.confidenceScore,
        }))
      ).catch(console.error);
    }
  }

  return NextResponse.json(result);
}

export async function GET() {
  const logs = await prisma.scrapeLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(logs);
}
