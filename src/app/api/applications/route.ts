import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const where = status ? { status } : {};

  const applications = await prisma.application.findMany({
    where,
    include: {
      job: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function PATCH(request: NextRequest) {
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
}
