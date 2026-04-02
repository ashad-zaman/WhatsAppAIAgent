import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICES = {
  free: process.env.STRIPE_PRICE_FREE || "price_free",
  pro: process.env.STRIPE_PRICE_PRO || "price_pro",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, price, billingCycle, email, phone, name, sessionToken } =
      body;

    if (!email || !phone || !planId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please login.",
        },
        { status: 400 },
      );
    }

    if (planId === "free") {
      const tempCode = Math.random().toString(36).substring(7);
      return NextResponse.json({
        redirectUrl: `/signup?code=${tempCode}&plan=free&phone=${phone}&email=${email}&name=${encodeURIComponent(name)}`,
      });
    }

    const planKey = planId as keyof typeof PLAN_PRICES;
    const stripePriceId = PLAN_PRICES[planKey];
    if (!stripePriceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&phone=${phone}&email=${email}&name=${encodeURIComponent(name)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/${planId}`,
      customer_email: email,
      metadata: {
        phone,
        name,
        planId,
        billingCycle,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
