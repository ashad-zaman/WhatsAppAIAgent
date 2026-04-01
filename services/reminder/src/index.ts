import express from "express";
import { createLogger } from "@whatsapp-ai/logger";
import Redis from "ioredis";
import Bull from "bull";
import { google } from "googleapis";
import { PrismaClient } from "@whatsapp-ai/database";

const logger = createLogger("reminder-service");
const app = express();
const PORT = process.env.PORT || 3006;

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const reminderQueue = new Bull(
  "reminders",
  process.env.REDIS_URL || "redis://localhost:6379",
);

app.use(express.json());

async function sendWhatsAppReminder(
  phoneNumber: string,
  title: string,
  scheduledAt: Date,
  repeatType: string,
) {
  const formattedDate = new Date(scheduledAt).toLocaleString();
  const repeatText =
    repeatType !== "NONE" ? `\n🔄 *Repeats: ${repeatType}*` : "";

  const message = `⏰ *Reminder*

📝 ${title}

🕐 ${formattedDate}${repeatText}

_This is your scheduled reminder from WhatsApp AI Platform_`;

  try {
    const { whatsappApi } = await import("@whatsapp-ai/whatsapp");
    await whatsappApi.sendTextMessage(phoneNumber, message);
    logger.info(`WhatsApp reminder sent to ${phoneNumber}: ${title}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send WhatsApp reminder to ${phoneNumber}:`, error);
    return false;
  }
}

async function sendSharedReminderNotification(
  phoneNumber: string,
  title: string,
  sharedByName: string,
) {
  const message = `🔔 *Shared Reminder*

📝 ${title}

👤 Shared by: ${sharedByName}

_You can view and manage this reminder in your dashboard_`;

  try {
    const { whatsappApi } = await import("@whatsapp-ai/whatsapp");
    await whatsappApi.sendTextMessage(phoneNumber, message);
    logger.info(`Shared reminder notification sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send shared reminder to ${phoneNumber}:`, error);
    return false;
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "reminder-service" });
});

// Get user reminders
app.get("/api/reminders/:userId", async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.params.userId },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(reminders);
  } catch (error) {
    logger.error("Failed to fetch reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// Create reminder with plan validation
app.post("/api/reminders", async (req, res) => {
  try {
    const {
      userId,
      title,
      scheduledAt,
      repeatType,
      timezone,
      sharedWith,
      notifyVia,
    } = req.body;

    // Check user plan
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Plan-based validation
    const planFeatures = {
      FREE: {
        maxReminders: 10,
        recurring: false,
        shared: false,
        callNotify: false,
      },
      PRO: {
        maxReminders: 100,
        recurring: true,
        shared: true,
        callNotify: true,
      },
      ENTERPRISE: {
        maxReminders: -1,
        recurring: true,
        shared: true,
        callNotify: true,
      },
    };

    const features =
      planFeatures[user.plan as keyof typeof planFeatures] || planFeatures.FREE;
    const reminderCount = await prisma.reminder.count({ where: { userId } });

    if (features.maxReminders > 0 && reminderCount >= features.maxReminders) {
      return res.status(403).json({
        error: `Plan limit reached. Upgrade to Pro for unlimited reminders.`,
        upgradeRequired: true,
      });
    }

    if (repeatType !== "NONE" && !features.recurring) {
      return res.status(403).json({
        error: "Recurring reminders require Pro plan",
        upgradeRequired: true,
      });
    }

    if (sharedWith?.length > 0 && !features.shared) {
      return res.status(403).json({
        error: "Shared reminders require Pro plan",
        upgradeRequired: true,
      });
    }

    if (notifyVia === "CALL" && !features.callNotify) {
      return res.status(403).json({
        error: "Call notifications require Pro plan",
        upgradeRequired: true,
      });
    }

    // Create reminder
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        scheduledAt: new Date(scheduledAt),
        repeatType: repeatType || "NONE",
        timezone: timezone || "UTC",
        notifyVia: notifyVia || "WHATSAPP",
        status: "PENDING",
      },
    });

    // Schedule the job
    if (reminderQueue) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        await reminderQueue.add(
          {
            reminderId: reminder.id,
            userId,
            title,
            timezone,
            sharedWith,
            notifyVia,
          },
          { delay, removeOnComplete: true },
        );
      }
    }

    // Handle shared reminders
    if (sharedWith?.length > 0) {
      for (const friendId of sharedWith) {
        await prisma.sharedReminder.create({
          data: {
            reminderId: reminder.id,
            sharedWithUserId: friendId,
            permission: "EDIT",
          },
        });
      }
    }

    res.json(reminder);
  } catch (error) {
    logger.error("Failed to create reminder:", error);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

// Update reminder
app.put("/api/reminders/:id", async (req, res) => {
  try {
    const { title, scheduledAt, repeatType, status, notifyVia } = req.body;
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        title,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        repeatType,
        status,
        notifyVia,
      },
    });
    res.json(reminder);
  } catch (error) {
    logger.error("Failed to update reminder:", error);
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

// Delete reminder
app.delete("/api/reminders/:id", async (req, res) => {
  try {
    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete reminder:", error);
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

// Get shared reminders
app.get("/api/reminders/shared/:userId", async (req, res) => {
  try {
    const sharedReminders = await prisma.sharedReminder.findMany({
      where: { sharedWithUserId: req.params.userId },
      include: { reminder: { include: { user: true } } },
    });
    res.json(
      sharedReminders.map((sr) => ({
        ...sr.reminder,
        sharedBy: sr.reminder.user.fullName,
        permission: sr.permission,
      })),
    );
  } catch (error) {
    logger.error("Failed to fetch shared reminders:", error);
    res.status(500).json({ error: "Failed to fetch shared reminders" });
  }
});

// Process reminder queue job
if (reminderQueue) {
  reminderQueue.process(async (job) => {
    const { reminderId, userId, title, timezone, sharedWith, notifyVia } =
      job.data;

    logger.info(`Processing reminder ${reminderId}: ${title}`);

    // Get user phone
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.phone) {
      logger.error(`User ${userId} has no phone number`);
      return;
    }

    // Send WhatsApp notification
    const message = `⏰ *Reminder*\n\n${title}\n\nTimezone: ${timezone || "UTC"}`;

    // Here you would call the WhatsApp API to send the message
    logger.info(`[WhatsApp] Would send to ${user.phone}: ${message}`);

    // Mark as completed
    await prisma.reminder.update({
      where: { id: reminderId },
      data: { status: "COMPLETED" },
    });

    // Handle recurring
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });
    if (reminder?.repeatType !== "NONE") {
      const nextDate = calculateNextDate(
        reminder.scheduledAt,
        reminder.repeatType,
      );
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { scheduledAt: nextDate, status: "PENDING" },
      });

      // Schedule next occurrence
      const nextDelay = nextDate.getTime() - Date.now();
      if (nextDelay > 0) {
        await reminderQueue.add(
          { reminderId, userId, title, timezone, sharedWith, notifyVia },
          { delay: nextDelay, removeOnComplete: true },
        );
      }
    }
  });
}

function calculateNextDate(currentDate: Date, repeatType: string): Date {
  const next = new Date(currentDate);
  switch (repeatType) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

app.listen(PORT, () => {
  logger.info(`Reminder service running on port ${PORT}`);
});

export default app;
