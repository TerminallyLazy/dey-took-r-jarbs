import { NextRequest, NextResponse } from "next/server";
import { scrapeIndeedJobs } from "@/lib/scraper";
import { analyzeMultipleJobs } from "@/lib/anthropic";
import { sendNewJobsNotification } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, pages = 2, analyze = true, notify = true } = body;

    if (!query || !location) {
      return NextResponse.json(
        { error: "Query and location are required" },
        { status: 400 }
      );
    }

    const result = await scrapeIndeedJobs(query, location, pages);

    if (result.newJobs > 0 && (analyze || notify)) {
      const newJobs = await prisma.job.findMany({
        where: { isNew: true, confidenceScore: null },
        orderBy: { scrapedAt: "desc" },
        take: result.newJobs,
      });

      if (analyze && newJobs.length > 0) {
        analyzeMultipleJobs(newJobs.map((j) => j.id)).catch(console.error);
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
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scrape failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const logs = await prisma.scrapeLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Scrape log error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
