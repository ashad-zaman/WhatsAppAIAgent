import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pushNotifications, emailNotifications, language, theme } = body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        timezone: language,
        pushNotifications: pushNotifications,
        emailNotifications: emailNotifications,
        theme: theme || "light",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
