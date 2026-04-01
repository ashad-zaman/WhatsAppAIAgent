import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, name, plan, password, sessionId } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const passwordHash = password
      ? crypto
          .pbkdf2Sync(
            password,
            crypto.randomBytes(16).toString("hex"),
            100000,
            64,
            "sha512",
          )
          .toString("hex")
      : null;

    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        fullName: name,
        passwordHash,
        plan: (plan?.toUpperCase() || "FREE") as any,
        isEmailVerified: true,
        isPhoneVerified: !!phone,
      },
    });

    if (plan && plan.toUpperCase() !== "FREE") {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: plan.toUpperCase() as any,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.session.create({
      data: {
        userId: user.id,
        channel: "DASHBOARD" as any,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (phone) {
      await sendWelcomeMessage(phone, name, plan || "free");
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        plan: user.plan,
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}

async function sendWelcomeMessage(phone: string, name: string, plan: string) {
  const PLAN_FEATURES: Record<string, string[]> = {
    free: [
      "5 AI Agents",
      "100 messages/month",
      "One-time Reminders",
      "Basic Recurring Reminders",
      "Calendar Integration",
      "Calendar Sync",
      "Timezone Support",
      "Document Storage (100MB)",
      "Notes Saving",
    ],
    pro: [
      "All AI Agents",
      "Unlimited Messages",
      "One-time & Recurring Reminders",
      "Shared Reminders with Friends",
      "Schedule Notifications",
      "Call Reminder Notifications",
      "Priority Support",
      "Voice Processing",
      "Timezone Support",
      "Calendar Sync (Google & Outlook)",
      "Document Storage (10GB)",
      "Notes Saving & Organization",
    ],
    enterprise: [
      "Everything in Pro",
      "Advanced Calendar Sync",
      "Unlimited Document Storage",
      "Advanced Notes Organization",
      "Dedicated Account Manager",
      "Custom SLA",
      "24/7 Phone Support",
      "On-premise Deployment",
      "Advanced Security",
    ],
  };

  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  const featuresList = features.map((f: string) => `• ${f}`).join("\n");

  const welcomeText = `👋 Welcome to WhatsApp AI Platform, ${name}!

🎉 Your *${plan.toUpperCase()}* plan is now active!

✨ Features:
${featuresList}

📱 Quick Actions:
• Chat with AI: Send a message
• Dashboard: Visit your dashboard
• Need help? Reply to this message!

Thank you! 🚀`;

  console.log(`[WhatsApp Mock] Would send to ${phone}:`, welcomeText);
}
