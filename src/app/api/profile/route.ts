import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.userProfile.findFirst();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error("Profile save error:", error);
    return NextResponse.json(
      { error: "Failed to save profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
