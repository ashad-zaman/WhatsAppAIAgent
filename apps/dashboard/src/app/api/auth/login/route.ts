import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      const isAdminEmail = email.toLowerCase().includes("admin");
      user = await prisma.user.create({
        data: {
          email,
          fullName: isAdminEmail ? "Admin User" : "John Doe",
          plan: isAdminEmail ? "ENTERPRISE" : "FREE",
          passwordHash: password ? `hashed_${password}` : null,
        },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      });
    }

    const isAdmin =
      user.plan === "ENTERPRISE" ||
      user.organizationMemberships.some(
        (m) => m.role === "OWNER" || m.role === "ADMIN",
      );
    const role = isAdmin ? "ADMIN" : "USER";

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        theme: user.theme,
        pushNotifications: user.pushNotifications,
        emailNotifications: user.emailNotifications,
        twoFactorEnabled: user.twoFactorEnabled,
        role,
        plan: user.plan,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
