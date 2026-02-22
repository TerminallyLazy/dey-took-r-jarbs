import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const configs = await prisma.searchConfig.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(configs);
}

export async function POST(request: NextRequest) {
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
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.searchConfig.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const { id, isActive } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const config = await prisma.searchConfig.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(config);
}
