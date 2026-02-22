import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalJobs,
      newJobs,
      applied,
      interviewing,
      offered,
      rejected,
      avgResult,
      lastScrape,
    ] = await Promise.all([
      prisma.job.count({ where: { isHidden: false } }),
      prisma.job.count({ where: { isNew: true, isHidden: false } }),
      prisma.application.count({ where: { status: "applied" } }),
      prisma.application.count({ where: { status: "interviewing" } }),
      prisma.application.count({ where: { status: "offered" } }),
      prisma.application.count({ where: { status: "rejected" } }),
      prisma.job.aggregate({
        _avg: { confidenceScore: true },
        where: { confidenceScore: { not: null }, isHidden: false },
      }),
      prisma.scrapeLog.findFirst({ orderBy: { startedAt: "desc" } }),
    ]);

    return NextResponse.json({
      totalJobs,
      newJobs,
      applied,
      interviewing,
      offered,
      rejected,
      avgConfidence: Math.round(avgResult._avg.confidenceScore || 0),
      lastScrape: lastScrape?.completedAt || lastScrape?.startedAt || null,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Database error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
