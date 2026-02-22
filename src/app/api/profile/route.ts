import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profile = await prisma.userProfile.findFirst();
  return NextResponse.json(profile);
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  const existing = await prisma.userProfile.findFirst();

  if (existing) {
    const profile = await prisma.userProfile.update({
      where: { id: existing.id },
      data,
    });
    return NextResponse.json(profile);
  }

  const profile = await prisma.userProfile.create({ data });
  return NextResponse.json(profile);
}
