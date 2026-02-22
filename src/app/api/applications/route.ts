import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { jobId, status = "interested", notes } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const application = await prisma.application.upsert({
      where: { jobId },
      create: {
        jobId,
        status,
        notes,
        appliedDate: status === "applied" ? new Date() : null,
      },
      update: {
        status,
        notes: notes ?? undefined,
        appliedDate: status === "applied" ? new Date() : undefined,
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Application create error:", error);
    return NextResponse.json(
      { error: "Failed to update application", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const where = status ? { status } : {};

    const applications = await prisma.application.findMany({
      where,
      include: { job: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Application list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, notes, followUpDate } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Application ID required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (status === "applied" && !data.appliedDate) data.appliedDate = new Date();

    const application = await prisma.application.update({
      where: { id },
      data,
      include: { job: true },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json(
      { error: "Failed to update application", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
