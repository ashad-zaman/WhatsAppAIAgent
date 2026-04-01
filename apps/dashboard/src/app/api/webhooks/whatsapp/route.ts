import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPhoneNumber } from "@whatsapp-ai/whatsapp";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const token = searchParams.get("token");
  const challenge = searchParams.get("challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verification" }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = parseWebhookPayload(body);

    if (messages.length === 0) {
      return NextResponse.json({ received: true });
    }

    for (const msg of messages) {
      await handleIncomingMessage(msg);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename: string };
}

function parseWebhookPayload(payload: unknown): WebhookMessage[] {
  const p = payload as {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: WebhookMessage[];
        };
      }>;
    }>;
  };

  if (p.object !== "whatsapp_business_account") return [];

  const msgs: WebhookMessage[] = [];
  for (const entry of p.entry || []) {
    for (const change of entry.changes || []) {
      if (change.value?.messages) {
        msgs.push(...change.value.messages);
      }
    }
  }
  return msgs;
}

async function handleIncomingMessage(message: WebhookMessage) {
  const phoneNumber = formatPhoneNumber(message.from);
  const messageText = message.text?.body?.trim() || "";
  const messageType = message.type;

  console.log(
    `Received ${messageType} from ${phoneNumber}:`,
    messageText.substring(0, 100),
  );

  const user = await prisma.user.findUnique({
    where: { phone: phoneNumber },
  });

  if (!user) {
    console.log("New user - would send welcome message to:", phoneNumber);
    return;
  }

  let session = await prisma.session.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (!session) {
    session = await prisma.session.create({
      data: {
        userId: user.id,
        agentId: null,
        channel: "WHATSAPP",
        expiresAt,
        context: { source: "whatsapp", phoneNumber },
      },
    });
  }

  if (messageType === "text" && messageText) {
    await processTextMessage(user.id, session.id, phoneNumber, messageText);
  } else if (messageType === "image") {
    await handleMediaMessage(
      user.id,
      session.id,
      phoneNumber,
      "image",
      message.image?.id || "",
    );
  } else if (messageType === "audio") {
    await handleMediaMessage(
      user.id,
      session.id,
      phoneNumber,
      "audio",
      message.audio?.id || "",
    );
  } else if (messageType === "document") {
    await handleMediaMessage(
      user.id,
      session.id,
      phoneNumber,
      "document",
      message.document?.id || "",
      message.document?.filename,
    );
  }
}

async function processTextMessage(
  userId: string,
  sessionId: string,
  phoneNumber: string,
  text: string,
) {
  await prisma.message.create({
    data: {
      userId,
      sessionId,
      direction: "INBOUND",
      content: { text },
      metadata: { source: "whatsapp", phoneNumber },
    },
  });

  const response = await generateAIResponse(text, userId);

  try {
    const { whatsappApi } = await import("@whatsapp-ai/whatsapp");
    await whatsappApi.sendTypingIndicator(phoneNumber, true);

    setTimeout(async () => {
      try {
        await whatsappApi.sendTextMessage(phoneNumber, response);

        await prisma.message.create({
          data: {
            userId,
            sessionId,
            direction: "OUTBOUND",
            content: { text: response },
            metadata: { source: "whatsapp" },
          },
        });
      } catch (e) {
        console.error("Failed to send response:", e);
      } finally {
        await whatsappApi.sendTypingIndicator(phoneNumber, false);
      }
    }, 1000);
  } catch (error) {
    console.error("WhatsApp API error:", error);
  }
}

async function generateAIResponse(
  text: string,
  userId: string,
): Promise<string> {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("remind")) {
    return `I can help you set a reminder! 

📱 Create by telling me: "Remind me to [task] at [time]"
• Example: "Remind me to call mom at 5pm"
• Or: "Remind me to buy groceries tomorrow morning"

⏰ Options:
• One-time reminders
• Daily/Weekly/Monthly recurring

Want me to set one for you?`;
  }

  if (
    lowerText.includes("calendar") ||
    lowerText.includes("meeting") ||
    lowerText.includes("schedule")
  ) {
    return `I'd be happy to help with calendar events! 

📅 Connect your calendar in the dashboard:
• Settings → Calendar
• Connect Google or Outlook

Then I can help you:
• Create events
• Check availability
• Find meeting times

What would you like to do?`;
  }

  if (lowerText.includes("document") || lowerText.includes("file")) {
    return `I can help with documents! 

📄 In your dashboard:
• Go to Documents section
• Upload PDF, DOCX, TXT files
• Click "Ask AI" to query them

I can summarize, answer questions, and find information in your documents!

What would you like to do?`;
  }

  if (lowerText.includes("help") || lowerText.includes("what can")) {
    return `I'm your WhatsApp AI Assistant! Here's what I can help with:

⏰ Reminders - "Remind me to..."
📅 Calendar - Create events
📄 Documents - Upload & analyze
💬 Chat - Ask me anything

Visit /dashboard for full features!
What would you like help with?`;
  }

  const reminders = await prisma.reminder.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });

  if (
    reminders.length > 0 &&
    (lowerText.includes("my reminders") || lowerText.includes("upcoming"))
  ) {
    const list = reminders
      .map((r) => `• ${r.title} - ${new Date(r.scheduledAt).toLocaleString()}`)
      .join("\n");
    return `Your upcoming reminders:\n\n${list}\n\nManage them at /dashboard/reminders`;
  }

  return `Thanks for messaging! 

I can help you with:
• ⏰ Reminders
• 📅 Calendar events  
• 📄 Documents
• 💬 General chat

What would you like?`;
}

async function handleMediaMessage(
  userId: string,
  sessionId: string,
  phoneNumber: string,
  type: string,
  mediaId: string,
  filename?: string,
) {
  const responses: Record<string, string> = {
    image:
      "Got your image! Upload it to the dashboard Documents section for detailed analysis.",
    audio:
      "Got your voice message! Upgrade to Pro for voice transcription, or describe what you'd like help with.",
    document: `Got your document: ${filename || "file"}! Upload to dashboard to index and analyze it.`,
  };

  const response = responses[type] || "Got your message!";

  await prisma.message.create({
    data: {
      userId,
      sessionId,
      direction: "OUTBOUND",
      content: { text: response },
      metadata: { source: "whatsapp", type, mediaId, filename },
    },
  });

  try {
    const { whatsappApi } = await import("@whatsapp-ai/whatsapp");
    await whatsappApi.sendTextMessage(phoneNumber, response);
  } catch (error) {
    console.error("Failed to send response:", error);
  }
}
