import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkReminderLimit,
  checkFeatureAccess,
} from "@/../../packages/security/src/planAccess";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const where = userId ? { userId } : {};

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Failed to fetch reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = (user?.plan || "free") as "free" | "pro" | "enterprise";

    const hasScheduledNotifications = checkFeatureAccess(
      plan,
      "scheduledNotifications",
    );
    if (
      !hasScheduledNotifications.allowed &&
      body.scheduledAt &&
      new Date(body.scheduledAt) > new Date()
    ) {
      return NextResponse.json(
        {
          error: "Scheduled notifications require Pro plan",
          upgradeUrl: "/pricing",
        },
        { status: 403 },
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayReminders = await prisma.reminder.count({
      where: {
        userId,
        scheduledAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const reminderCheck = checkReminderLimit(plan, todayReminders);
    if (!reminderCheck.allowed) {
      return NextResponse.json(
        {
          error: `Daily reminder limit reached. Upgrade to Pro for unlimited reminders.`,
          upgradeUrl: "/pricing",
          limit: reminderCheck.remaining || 0,
        },
        { status: 403 },
      );
    }

    const scheduledAt = body.scheduledAt
      ? new Date(body.scheduledAt)
      : new Date();

    const newReminder = await prisma.reminder.create({
      data: {
        userId,
        title: body.title || body.text,
        description: body.description,
        scheduledAt,
        timezone: body.timezone || "UTC",
        repeatType: body.repeatType || "NONE",
        repeatInterval: body.repeatInterval || 1,
        repeatEndDate: body.repeatEndDate ? new Date(body.repeatEndDate) : null,
        status: body.status || "PENDING",
        source: body.source || "DASHBOARD",
        metadata: body.metadata || {},
      },
    });

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    console.error("Failed to create reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 },
    );
  }
}
