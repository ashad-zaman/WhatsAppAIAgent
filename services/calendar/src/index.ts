import express from "express";
import { createLogger } from "@whatsapp-ai/logger";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const logger = createLogger("calendar-service");
const app = express();
const PORT = process.env.PORT || 3007;

const prisma = new PrismaClient();

app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3007/auth/google/callback",
);

app.get("/api/calendar/auth/:userId/:provider", async (req, res) => {
  try {
    const { userId, provider } = req.params;

    if (provider === "google") {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: userId,
      });
      res.json({ authUrl });
    } else {
      res.status(400).json({ error: "Invalid provider" });
    }
  } catch (error) {
    logger.error("Failed to generate auth URL:", error);
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    const { tokens } = await oauth2Client.getToken(code as string);

    await prisma.calendarToken.upsert({
      where: { userId: userId as string },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        provider: "GOOGLE",
      },
      create: {
        userId: userId as string,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        provider: "GOOGLE",
      },
    });

    res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/calendar?connected=google`,
    );
  } catch (error) {
    logger.error("OAuth callback failed:", error);
    res.redirect("/dashboard/calendar?error=auth_failed");
  }
});

app.get("/api/calendar/events/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sync } = req.query;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const planFeatures: Record<string, { sync: boolean }> = {
      FREE: { sync: false },
      PRO: { sync: true },
      ENTERPRISE: { sync: true },
    };

    const features = planFeatures[user?.plan || "FREE"];

    const localEvents = await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    });

    if (sync === "true" && features.sync) {
      const tokens = await prisma.calendarToken.findUnique({
        where: { userId },
      });
      if (tokens?.provider === "GOOGLE" && tokens.accessToken) {
        oauth2Client.setCredentials({ access_token: tokens.accessToken });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const response = await calendar.events.list({
          calendarId: "primary",
          timeMin: new Date().toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: "startTime",
        });
        logger.info(
          `Synced ${response.data.items?.length || 0} events from Google`,
        );
      }
    }

    res.json(localEvents);
  } catch (error) {
    logger.error("Failed to fetch calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

app.post("/api/calendar/events", async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      startTime,
      endTime,
      location,
      provider,
      syncToExternal,
    } = req.body;

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        provider: provider || "GOOGLE",
        status: "SCHEDULED",
      },
    });

    if (syncToExternal) {
      const tokens = await prisma.calendarToken.findUnique({
        where: { userId },
      });
      if (tokens?.provider === "GOOGLE" && tokens.accessToken) {
        oauth2Client.setCredentials({ access_token: tokens.accessToken });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: title,
            description,
            location,
            start: { dateTime: startTime, timeZone: "UTC" },
            end: { dateTime: endTime, timeZone: "UTC" },
          },
        });
      }
    }

    res.json(event);
  } catch (error) {
    logger.error("Failed to create calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

app.put("/api/calendar/events/:id", async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, status } =
      req.body;
    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        status,
      },
    });
    res.json(event);
  } catch (error) {
    logger.error("Failed to update calendar event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

app.delete("/api/calendar/events/:id", async (req, res) => {
  try {
    await prisma.calendarEvent.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete calendar event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

app.get("/api/calendar/conflicts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { startTime, endTime } = req.query;

    const conflicts = await prisma.calendarEvent.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: {
              gte: new Date(startTime as string),
              lt: new Date(endTime as string),
            },
          },
          {
            endTime: {
              gt: new Date(startTime as string),
              lte: new Date(endTime as string),
            },
          },
          {
            startTime: { lte: new Date(startTime as string) },
            endTime: { gte: new Date(endTime as string) },
          },
        ],
      },
    });

    res.json({ hasConflicts: conflicts.length > 0, conflicts });
  } catch (error) {
    logger.error("Failed to check conflicts:", error);
    res.status(500).json({ error: "Failed to check conflicts" });
  }
});

app.get("/api/calendar/status/:userId", async (req, res) => {
  try {
    const tokens = await prisma.calendarToken.findUnique({
      where: { userId: req.params.userId },
    });
    res.json({ connected: !!tokens, provider: tokens?.provider || null });
  } catch (error) {
    logger.error("Failed to get calendar status:", error);
    res.status(500).json({ error: "Failed to get calendar status" });
  }
});

app.delete("/api/calendar/disconnect/:userId", async (req, res) => {
  try {
    await prisma.calendarToken.delete({ where: { userId: req.params.userId } });
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to disconnect calendar:", error);
    res.status(500).json({ error: "Failed to disconnect calendar" });
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "calendar-service" }),
);

app.listen(PORT, () => logger.info(`Calendar service running on port ${PORT}`));

export default app;
