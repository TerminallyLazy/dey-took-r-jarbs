import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { jobId, tone = "professional" } = await request.json();

  if (!jobId) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 });
  }

  const content = await generateCoverLetter(jobId, tone);
  return NextResponse.json({ content });
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 });
  }

  const coverLetters = await prisma.coverLetter.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coverLetters);
}
