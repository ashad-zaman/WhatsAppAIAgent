import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.organization.findFirst({
      select: {
        name: true,
        settings: true,
      },
    });
    return NextResponse.json(settings?.settings || {});
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const settings = {
      ...(typeof org.settings === "object" ? org.settings : {}),
      ...body,
    };

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: { settings },
    });

    return NextResponse.json(updated.settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
