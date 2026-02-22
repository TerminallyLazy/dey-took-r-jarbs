import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeJobMatch } from "@/lib/anthropic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        application: true,
        coverLetters: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.isNew) {
      await prisma.job.update({ where: { id }, data: { isNew: false } });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.job.update({
      where: { id },
      data: { isHidden: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job delete error:", error);
    return NextResponse.json(
      { error: "Failed to hide job", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (action === "analyze") {
      const result = await analyzeJobMatch(id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Job action error:", error);
    return NextResponse.json(
      { error: "Action failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
