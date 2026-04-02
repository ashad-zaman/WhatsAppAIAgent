import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, address } = body;

    const fullName = `${firstName} ${lastName}`.trim();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phone,
        address: address || "",
      },
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      address: updated.address,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
