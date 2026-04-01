import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enable } = body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: enable,
      },
    });

    return NextResponse.json({
      twoFactorEnabled: enable,
      message: enable ? "2FA enabled" : "2FA disabled",
    });
  } catch (error) {
    console.error("Failed to toggle 2FA:", error);
    return NextResponse.json(
      { error: "Failed to toggle 2FA" },
      { status: 500 },
    );
  }
}
