import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const { email, phone, name, planId, billingCycle } =
          session.metadata || {};

        if (!email || !planId) {
          console.error("Missing metadata in checkout session");
          break;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { plan: planId.toUpperCase() },
          });

          await prisma.subscription.upsert({
            where: { userId: existingUser.id },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            create: {
              userId: existingUser.id,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan: planId.toUpperCase() as any,
              status: "ACTIVE",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          console.log(`Updated subscription for user: ${email} to ${planId}`);

          if (phone && name) {
            await sendWelcomeMessage(phone, name, planId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const existingSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (existingSub) {
          const statusMap: Record<string, any> = {
            active: "ACTIVE",
            past_due: "PAST_DUE",
            canceled: "CANCELLED",
            trialing: "TRIALING",
          };

          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: statusMap[subscription.status] || "ACTIVE",
              currentPeriodStart: new Date(
                subscription.current_period_start * 1000,
              ),
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000,
              ),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          console.log(`Updated subscription status: ${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const existingSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: { status: "CANCELLED" },
          });

          await prisma.user.update({
            where: { id: existingSub.userId },
            data: { plan: "FREE" },
          });

          console.log(`Subscription cancelled for customer: ${customerId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const existingSub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: {
                status: "ACTIVE",
                currentPeriodStart: new Date(invoice.period_start * 1000),
                currentPeriodEnd: new Date(invoice.period_end * 1000),
              },
            });

            console.log(
              `Payment succeeded for subscription: ${subscriptionId}`,
            );
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const existingSub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: { status: "PAST_DUE" },
            });

            console.log(`Payment failed for subscription: ${subscriptionId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
