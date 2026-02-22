import { NextRequest, NextResponse } from "next/server";
import { scrapeIndeedJobs } from "@/lib/scraper";
import { analyzeMultipleJobs } from "@/lib/anthropic";
import { sendNewJobsNotification } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await prisma.searchConfig.findMany({
    where: { isActive: true },
  });

  if (configs.length === 0) {
    return NextResponse.json({ message: "No active search configs" });
  }

  const results = [];
  let totalNewJobs = 0;

  for (const config of configs) {
    const result = await scrapeIndeedJobs(config.query, config.location, 2);
    results.push(result);
    totalNewJobs += result.newJobs;
  }

  // Analyze new jobs
  if (totalNewJobs > 0) {
    const newJobs = await prisma.job.findMany({
      where: { isNew: true, confidenceScore: null },
      orderBy: { scrapedAt: "desc" },
    });

    if (newJobs.length > 0) {
      await analyzeMultipleJobs(newJobs.map((j) => j.id));

      // Re-fetch with scores for notification
      const analyzedJobs = await prisma.job.findMany({
        where: { id: { in: newJobs.map((j) => j.id) } },
      });

      await sendNewJobsNotification(
        analyzedJobs.map((j) => ({
          title: j.title,
          company: j.company,
          location: j.location,
          salary: j.salary,
          url: j.url,
          confidenceScore: j.confidenceScore,
        }))
      );
    }
  }

  return NextResponse.json({
    message: `Cron completed. ${totalNewJobs} new jobs found.`,
    results,
  });
}
