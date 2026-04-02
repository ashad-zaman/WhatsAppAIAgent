import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/../../packages/security/src/planAccess";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const currentPlan = (user?.plan || "free").toLowerCase() as
      | "free"
      | "pro"
      | "enterprise";
    const limits = PLAN_LIMITS[currentPlan];

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        plan: currentPlan,
        limits,
        plans: [
          {
            id: "free",
            name: "Free",
            price: 0,
            features: ["5 AI Agents", "100 messages/month", "Basic reminders"],
          },
          {
            id: "pro",
            name: "Pro",
            price: 29,
            features: [
              "All AI Agents",
              "Unlimited messages",
              "Priority support",
            ],
          },
          {
            id: "enterprise",
            name: "Enterprise",
            price: 99,
            features: [
              "Everything in Pro",
              "Dedicated support",
              "Custom solutions",
            ],
          },
        ],
      });
    }

    return NextResponse.json({ subscription, plan: currentPlan, limits });
  } catch (error) {
    console.error("Failed to fetch billing:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "User ID and plan required" },
        { status: 400 },
      );
    }

    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    let subscription;
    if (existingSub) {
      subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          plan: plan.toUpperCase(),
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          plan: plan.toUpperCase(),
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { plan: plan.toUpperCase() },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const subscription = await prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
