import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { jobId, tone = "professional" } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const content = await generateCoverLetter(jobId, tone);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Cover letter error:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const coverLetters = await prisma.coverLetter.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coverLetters);
  } catch (error) {
    console.error("Cover letter list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cover letters", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
