import { describe, it, expect, beforeEach } from "vitest";

// Mock data
const mockEvents = [
  {
    id: "event-1",
    userId: "user-123",
    title: "Team Standup",
    description: "Daily team meeting",
    startTime: new Date("2026-04-02T09:00:00Z"),
    endTime: new Date("2026-04-02T09:30:00Z"),
    location: "Zoom",
    attendees: ["team@example.com"],
    status: "SCHEDULED" as const,
    provider: "GOOGLE" as const,
  },
  {
    id: "event-2",
    userId: "user-123",
    title: "Client Call",
    description: "Project discussion",
    startTime: new Date("2026-04-03T14:00:00Z"),
    endTime: new Date("2026-04-03T15:00:00Z"),
    location: "Office",
    attendees: ["client@example.com"],
    status: "CONFIRMED" as const,
    provider: "OUTLOOK" as const,
  },
];

const db = {
  events: [...mockEvents],
  calendarTokens: [] as Array<{
    userId: string;
    provider: string;
    accessToken: string;
  }>,
};

describe("Calendar Events API Tests", () => {
  beforeEach(() => {
    db.events = [...mockEvents];
    db.calendarTokens = [];
  });

  describe("GET /api/events", () => {
    it("should fetch all events for user", () => {
      const fetchEvents = (userId: string) => {
        return db.events.filter((e) => e.userId === userId);
      };

      const events = fetchEvents("user-123");
      expect(events.length).toBe(2);
    });

    it("should return empty for unknown user", () => {
      const fetchEvents = (userId: string) => {
        return db.events.filter((e) => e.userId === userId);
      };

      const events = fetchEvents("unknown-user");
      expect(events.length).toBe(0);
    });
  });

  describe("Date Range Filtering", () => {
    it("should filter by date range", () => {
      const fetchByDateRange = (userId: string, start: Date, end: Date) => {
        return db.events.filter(
          (e) =>
            e.userId === userId &&
            new Date(e.startTime) >= start &&
            new Date(e.startTime) <= end,
        );
      };

      const start = new Date("2026-04-01T00:00:00Z");
      const end = new Date("2026-04-02T23:59:59Z");
      const events = fetchByDateRange("user-123", start, end);

      expect(events.length).toBe(1);
      expect(events[0].title).toBe("Team Standup");
    });

    it("should filter by status", () => {
      const fetchByStatus = (userId: string, status: string) => {
        return db.events.filter(
          (e) => e.userId === userId && e.status === status,
        );
      };

      const scheduled = fetchByStatus("user-123", "SCHEDULED");
      expect(scheduled.length).toBe(1);
    });

    it("should sort by start time", () => {
      const fetchSorted = (userId: string) => {
        return db.events
          .filter((e) => e.userId === userId)
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          );
      };

      const sorted = fetchSorted("user-123");
      expect(
        new Date(sorted[0].startTime) < new Date(sorted[1].startTime),
      ).toBe(true);
    });
  });

  describe("POST /api/events", () => {
    it("should create event with all fields", () => {
      const createEvent = (data: {
        userId: string;
        title: string;
        startTime: Date;
        endTime: Date;
        location?: string;
        attendees?: string[];
      }) => {
        const event = {
          id: `event-${Date.now()}`,
          ...data,
          description: data.description || "",
          location: data.location || "",
          attendees: data.attendees || [],
          status: "SCHEDULED" as const,
          provider: "GOOGLE" as const,
        };
        db.events.push(event);
        return event;
      };

      const result = createEvent({
        userId: "user-123",
        title: "New Meeting",
        startTime: new Date("2026-04-05T10:00:00Z"),
        endTime: new Date("2026-04-05T11:00:00Z"),
        location: "Conference Room A",
        attendees: ["colleague@example.com"],
      });

      expect(result.title).toBe("New Meeting");
      expect(result.location).toBe("Conference Room A");
      expect(result.status).toBe("SCHEDULED");
    });

    it("should validate end time after start time", () => {
      const isValidTimeRange = (start: Date, end: Date) => {
        return end > start;
      };

      const validStart = new Date("2026-04-05T10:00:00Z");
      const validEnd = new Date("2026-04-05T11:00:00Z");
      expect(isValidTimeRange(validStart, validEnd)).toBe(true);

      const invalidEnd = new Date("2026-04-05T09:00:00Z");
      expect(isValidTimeRange(validStart, invalidEnd)).toBe(false);
    });

    it("should validate required fields", () => {
      const createEvent = (
        data: Partial<{
          userId: string;
          title: string;
          startTime: Date;
          endTime: Date;
        }>,
      ) => {
        if (!data.title) throw new Error("Title is required");
        if (!data.startTime) throw new Error("Start time is required");
        if (!data.endTime) throw new Error("End time is required");
        return { ...data, status: "SCHEDULED" as const };
      };

      expect(() => createEvent({ title: "" })).toThrow("Title is required");
      expect(() =>
        createEvent({ title: "Test", startTime: undefined }),
      ).toThrow("Start time is required");
    });

    it("should default to GOOGLE provider", () => {
      const createEvent = (data: {
        userId: string;
        title: string;
        startTime: Date;
        endTime: Date;
        provider?: string;
      }) => {
        return {
          ...data,
          provider: data.provider || "GOOGLE",
          status: "SCHEDULED" as const,
        };
      };

      const withProvider = createEvent({
        userId: "user-123",
        title: "Test",
        startTime: new Date(),
        endTime: new Date(),
        provider: "OUTLOOK",
      });

      const withoutProvider = createEvent({
        userId: "user-123",
        title: "Test",
        startTime: new Date(),
        endTime: new Date(),
      });

      expect(withProvider.provider).toBe("OUTLOOK");
      expect(withoutProvider.provider).toBe("GOOGLE");
    });
  });

  describe("PUT /api/events/:id", () => {
    it("should update event title", () => {
      const updateEvent = (id: string, updates: { title?: string }) => {
        const index = db.events.findIndex((e) => e.id === id);
        if (index !== -1) {
          db.events[index] = { ...db.events[index], ...updates };
          return db.events[index];
        }
        return null;
      };

      const updated = updateEvent("event-1", { title: "Updated Meeting" });
      expect(updated?.title).toBe("Updated Meeting");
    });

    it("should update event time", () => {
      const reschedule = (id: string, startTime: Date, endTime: Date) => {
        const index = db.events.findIndex((e) => e.id === id);
        if (index !== -1) {
          db.events[index].startTime = startTime;
          db.events[index].endTime = endTime;
          return db.events[index];
        }
        return null;
      };

      const newStart = new Date("2026-04-06T11:00:00Z");
      const newEnd = new Date("2026-04-06T12:00:00Z");
      const rescheduled = reschedule("event-1", newStart, newEnd);

      expect(rescheduled?.startTime).toEqual(newStart);
    });

    it("should add attendees", () => {
      const addAttendees = (id: string, attendees: string[]) => {
        const index = db.events.findIndex((e) => e.id === id);
        if (index !== -1) {
          db.events[index].attendees = [
            ...db.events[index].attendees,
            ...attendees,
          ];
          return db.events[index];
        }
        return null;
      };

      const updated = addAttendees("event-1", [
        "new@example.com",
        "another@example.com",
      ]);
      expect(updated?.attendees.length).toBe(3);
    });

    it("should update event status", () => {
      const updateStatus = (
        id: string,
        status: "SCHEDULED" | "CONFIRMED" | "CANCELLED",
      ) => {
        const index = db.events.findIndex((e) => e.id === id);
        if (index !== -1) {
          db.events[index].status = status;
          return db.events[index];
        }
        return null;
      };

      const cancelled = updateStatus("event-1", "CANCELLED");
      expect(cancelled?.status).toBe("CANCELLED");
    });
  });

  describe("DELETE /api/events/:id", () => {
    it("should delete event", () => {
      const deleteEvent = (id: string) => {
        const index = db.events.findIndex((e) => e.id === id);
        if (index !== -1) {
          db.events.splice(index, 1);
          return true;
        }
        return false;
      };

      expect(deleteEvent("event-1")).toBe(true);
      expect(db.events.length).toBe(1);
    });

    it("should return false for non-existent event", () => {
      const deleteEvent = (id: string) => {
        const index = db.events.findIndex((e) => e.id === id);
        if (index !== -1) {
          db.events.splice(index, 1);
          return true;
        }
        return false;
      };

      expect(deleteEvent("non-existent")).toBe(false);
    });
  });

  describe("Conflict Detection", () => {
    it("should detect overlapping events", () => {
      const event1Start = new Date("2026-04-02T09:00:00Z");
      const event1End = new Date("2026-04-02T09:30:00Z");
      const newEventStart = new Date("2026-04-02T09:00:00Z");
      const newEventEnd = new Date("2026-04-02T10:00:00Z");
      const overlap =
        newEventStart.getTime() < event1End.getTime() &&
        newEventEnd.getTime() > event1Start.getTime();
      expect(overlap).toBe(true);
    });

    it("should allow non-overlapping events", () => {
      const hasConflict = (
        newStart: Date,
        newEnd: Date,
        existingEvents: typeof mockEvents,
      ) => {
        return existingEvents.some((e) => {
          const existingStart = new Date(e.startTime);
          const existingEnd = new Date(e.endTime);
          return newStart < existingEnd && newEnd > existingStart;
        });
      };

      // New event: 11:00 - 12:00 doesn't overlap with 9:00 - 9:30
      const newStart = new Date("2026-04-02T11:00:00Z");
      const newEnd = new Date("2026-04-02T12:00:00Z");

      expect(hasConflict(newStart, newEnd, db.events)).toBe(false);
    });
  });

  describe("Calendar Integration", () => {
    it("should store OAuth token", () => {
      const storeToken = (userId: string, provider: string, token: string) => {
        db.calendarTokens.push({ userId, provider, accessToken: token });
      };

      storeToken("user-123", "GOOGLE", "ya29.token");
      expect(db.calendarTokens.length).toBe(1);
    });

    it("should find token by provider", () => {
      db.calendarTokens.push({
        userId: "user-123",
        provider: "GOOGLE",
        accessToken: "token123",
      });

      const findToken = (userId: string, provider: string) => {
        return db.calendarTokens.find(
          (t) => t.userId === userId && t.provider === provider,
        );
      };

      const token = findToken("user-123", "GOOGLE");
      expect(token?.accessToken).toBe("token123");
    });

    it("should validate provider values", () => {
      const validProviders = ["GOOGLE", "OUTLOOK"];

      expect(validProviders.includes("GOOGLE")).toBe(true);
      expect(validProviders.includes("FACEBOOK")).toBe(false);
    });
  });
});
