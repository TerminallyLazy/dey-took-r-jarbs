import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "scrapedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const showHidden = searchParams.get("showHidden") === "true";
    const newOnly = searchParams.get("newOnly") === "true";

    const where: Record<string, unknown> = {};

    if (!showHidden) where.isHidden = false;
    if (newOnly) where.isNew = true;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      if (status === "no-application") {
        where.application = null;
      } else {
        where.application = { status };
      }
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          application: true,
          coverLetters: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { error: "Database error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id },
      data,
      include: { application: true, coverLetters: true },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Jobs PATCH error:", error);
    return NextResponse.json(
      { error: "Update failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
