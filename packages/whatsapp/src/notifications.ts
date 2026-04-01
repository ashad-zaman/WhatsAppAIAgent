import { whatsappApi } from "@whatsapp-ai/whatsapp";

const MessageType = {
  TEXT: "text",
  IMAGE: "image",
  AUDIO: "audio",
  VIDEO: "video",
  DOCUMENT: "document",
  INTERACTIVE: "interactive",
  TEMPLATE: "template",
} as const;

interface PlanFeatures {
  free: string[];
  pro: string[];
  enterprise: string[];
}

const PLAN_FEATURES: PlanFeatures = {
  free: [
    "5 AI Agents",
    "100 messages/month",
    "Basic reminders",
    "Calendar integration",
    "100MB document storage",
  ],
  pro: [
    "All AI Agents",
    "Unlimited messages",
    "Advanced reminders",
    "Voice message processing",
    "Priority support",
    "Custom integrations",
    "10GB document storage",
  ],
  enterprise: [
    "Everything in Pro",
    "Dedicated account manager",
    "Custom SLA",
    "On-premise deployment",
    "Advanced security",
    "Custom AI training",
    "Unlimited storage",
    "24/7 phone support",
    "SSO & SAML",
  ],
};

export async function sendWelcomeMessage(
  phone: string,
  name: string,
  plan: string,
): Promise<boolean> {
  try {
    const features =
      PLAN_FEATURES[plan as keyof PlanFeatures] || PLAN_FEATURES.free;

    const featuresList = features.map((f) => `• ${f}`).join("\n");

    const welcomeText = `👋 Welcome to WhatsApp AI Platform, ${name}!

🎉 Your *${plan.toUpperCase()}* plan is now active!

✨ Here's what's included:
${featuresList}

📱 Quick Actions:
• Chat with AI: Send a message to get started
• Dashboard: Visit your dashboard to manage settings
• View Plans: Check out other plans for more features

💡 Need help? Just reply to this message!

Thank you for joining us! 🚀`;

    await whatsappApi.sendMessage({
      messaging_product: "whatsapp",
      to: phone,
      type: "text" as any,
      text: {
        body: welcomeText,
      },
    });

    console.log(`Welcome message sent to ${phone}`);
    return true;
  } catch (error) {
    console.error("Failed to send welcome message:", error);
    return false;
  }
}

export async function sendPaymentConfirmation(
  phone: string,
  name: string,
  plan: string,
  amount: number,
): Promise<boolean> {
  try {
    const confirmationText = `✅ Payment Confirmed!

Hi ${name}! Your payment of $${amount}/month has been processed successfully.

🎯 Your *${plan.toUpperCase()}* plan is now active!

You can now access all premium features. Start by visiting your dashboard or sending a message to any of our AI agents.

Thank you for your purchase! 🎉`;

    await whatsappApi.sendMessage({
      messaging_product: "whatsapp",
      to: phone,
      type: "text" as any,
      text: {
        body: confirmationText,
      },
    });

    console.log(`Payment confirmation sent to ${phone}`);
    return true;
  } catch (error) {
    console.error("Failed to send payment confirmation:", error);
    return false;
  }
}

export async function sendPlanUpgradeNotification(
  phone: string,
  name: string,
  oldPlan: string,
  newPlan: string,
): Promise<boolean> {
  try {
    const newFeatures = PLAN_FEATURES[newPlan as keyof PlanFeatures] || [];
    const featuresList = newFeatures
      .slice(0, 5)
      .map((f) => `• ${f}`)
      .join("\n");

    const upgradeText = `🎊 Plan Upgraded!

Hi ${name}! You've successfully upgraded from *${oldPlan.toUpperCase()}* to *${newPlan.toUpperCase()}*!

✨ New features unlocked:
${featuresList}
${newFeatures.length > 5 ? `\n+ ${newFeatures.length - 5} more features` : ""}

🚀 Enjoy your enhanced experience!

Need any help? Just reply to this message.`;

    await whatsappApi.sendMessage({
      messaging_product: "whatsapp",
      to: phone,
      type: "text" as any,
      text: {
        body: upgradeText,
      },
    });

    console.log(`Plan upgrade notification sent to ${phone}`);
    return true;
  } catch (error) {
    console.error("Failed to send upgrade notification:", error);
    return false;
  }
}

export async function sendReminderNotification(
  phone: string,
  title: string,
  scheduledAt: Date,
): Promise<boolean> {
  try {
    const timeStr = scheduledAt.toLocaleString();

    const reminderText = `⏰ Reminder Set!

${title}

Scheduled for: ${timeStr}

We'll notify you when it's time!`;

    await whatsappApi.sendMessage({
      messaging_product: "whatsapp",
      to: phone,
      type: "text" as any,
      text: {
        body: reminderText,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to send reminder notification:", error);
    return false;
  }
}

export { MessageType };
export { PLAN_FEATURES };
