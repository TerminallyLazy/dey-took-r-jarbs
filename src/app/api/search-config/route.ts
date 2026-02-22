import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const configs = await prisma.searchConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Search config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch configs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, location } = await request.json();

    if (!query || !location) {
      return NextResponse.json(
        { error: "Query and location required" },
        { status: 400 }
      );
    }

    const config = await prisma.searchConfig.create({
      data: { query, location },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Search config create error:", error);
    return NextResponse.json(
      { error: "Failed to create config", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.searchConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Search config delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete config", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const config = await prisma.searchConfig.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Search config update error:", error);
    return NextResponse.json(
      { error: "Failed to update config", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
