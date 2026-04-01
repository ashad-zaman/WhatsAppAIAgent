import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Create default organization first
    const org = await prisma.organization.upsert({
      where: { id: "default-org" },
      update: {},
      create: {
        id: "default-org",
        name: "Default Organization",
        ownerId: "", // will be updated
      },
    });

    // Create sample users (including demo login users)
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: "john@example.com" },
        update: {},
        create: {
          email: "john@example.com",
          fullName: "John Doe",
          plan: "PRO",
          passwordHash: "hashed_demo",
        },
      }),
      prisma.user.upsert({
        where: { email: "sarah@example.com" },
        update: {},
        create: {
          email: "sarah@example.com",
          fullName: "Sarah Smith",
          plan: "FREE",
          passwordHash: "hashed_demo",
        },
      }),
      prisma.user.upsert({
        where: { email: "mike@example.com" },
        update: {},
        create: {
          email: "mike@example.com",
          fullName: "Mike Johnson",
          plan: "ENTERPRISE",
          passwordHash: "hashed_demo",
        },
      }),
      // Demo login users
      prisma.user.upsert({
        where: { email: "test@example.com" },
        update: {},
        create: {
          email: "test@example.com",
          fullName: "Demo User",
          plan: "FREE",
          passwordHash: "hashed_demo123",
        },
      }),
      prisma.user.upsert({
        where: { email: "admin@demo.com" },
        update: {},
        create: {
          email: "admin@demo.com",
          fullName: "Admin User",
          plan: "ENTERPRISE",
          passwordHash: "hashed_demo123",
        },
      }),
    ]);

    // Update organization owner
    await prisma.organization.update({
      where: { id: "default-org" },
      data: { ownerId: users[4].id },
    });

    // Create AI Agents
    const agents = [
      {
        orgId: org.id,
        name: "Reminder Agent",
        type: "REMINDER" as const,
        systemPrompt:
          "You are a smart reminder assistant that helps users manage their daily tasks and reminders.",
        isActive: true,
      },
      {
        orgId: org.id,
        name: "Calendar Agent",
        type: "CALENDAR" as const,
        systemPrompt:
          "You are a calendar management assistant that helps users schedule and track events.",
        isActive: true,
      },
      {
        orgId: org.id,
        name: "Document Agent",
        type: "DOCUMENT" as const,
        systemPrompt:
          "You are a document processing assistant that helps users manage and analyze documents.",
        isActive: true,
      },
      {
        orgId: org.id,
        name: "Conversation Agent",
        type: "CONVERSATION" as const,
        systemPrompt:
          "You are a conversational AI assistant that provides natural language dialogue and Q&A.",
        isActive: true,
      },
      {
        orgId: org.id,
        name: "Voice Agent",
        type: "VOICE" as const,
        systemPrompt:
          "You are a voice assistant that supports speech recognition and synthesis.",
        isActive: false,
      },
    ];

    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.name.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: agent,
      });
    }

    // Create sample reminders
    const reminders = [
      {
        userId: users[0].id,
        title: "Team standup meeting",
        scheduledAt: new Date(Date.now() + 3600000),
        status: "PENDING" as const,
        repeatType: "DAILY" as const,
      },
      {
        userId: users[0].id,
        title: "Call mom",
        scheduledAt: new Date(Date.now() + 7200000),
        status: "PENDING" as const,
        repeatType: "WEEKLY" as const,
      },
      {
        userId: users[1].id,
        title: "Gym session",
        scheduledAt: new Date(Date.now() + 86400000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[1].id,
        title: "Submit project report",
        scheduledAt: new Date(Date.now() + 172800000),
        status: "COMPLETED" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[2].id,
        title: "Client presentation",
        scheduledAt: new Date(Date.now() + 259200000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      // Demo user reminders (test@example.com = users[3])
      {
        userId: users[3].id,
        title: "Morning standup",
        scheduledAt: new Date(Date.now() + 1800000),
        status: "PENDING" as const,
        repeatType: "DAILY" as const,
      },
      {
        userId: users[3].id,
        title: "Review project proposal",
        scheduledAt: new Date(Date.now() + 7200000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[3].id,
        title: "Team sync",
        scheduledAt: new Date(Date.now() + 14400000),
        status: "PENDING" as const,
        repeatType: "WEEKLY" as const,
      },
      // Admin user reminders (admin@demo.com = users[4])
      {
        userId: users[4].id,
        title: "Client call",
        scheduledAt: new Date(Date.now() + 3600000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[4].id,
        title: "Sprint planning",
        scheduledAt: new Date(Date.now() + 86400000),
        status: "PENDING" as const,
        repeatType: "WEEKLY" as const,
      },
    ];

    for (const reminder of reminders) {
      await prisma.reminder.upsert({
        where: { id: reminder.title.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: reminder,
      });
    }

    // Create sample calendar events
    const events = [
      {
        userId: users[0].id,
        title: "Team standup",
        description: "Daily team sync meeting",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 5400000),
        location: "Zoom",
        status: "SCHEDULED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[0].id,
        title: "Lunch with team",
        description: "Team building lunch",
        startTime: new Date(Date.now() + 14400000),
        endTime: new Date(Date.now() + 18000000),
        location: "Restaurant XYZ",
        status: "CONFIRMED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[1].id,
        title: "Project review",
        description: "Q1 project milestone review",
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
        location: "Conference Room A",
        status: "SCHEDULED" as const,
        provider: "OUTLOOK" as const,
      },
      {
        userId: users[2].id,
        title: "Client meeting",
        description: "Quarterly business review",
        startTime: new Date(Date.now() + 172800000),
        endTime: new Date(Date.now() + 180000000),
        location: "Client Office",
        status: "CONFIRMED" as const,
        provider: "GOOGLE" as const,
      },
      // Demo user events (test@example.com = users[3])
      {
        userId: users[3].id,
        title: "Daily standup",
        description: "Team sync meeting",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 5400000),
        location: "Google Meet",
        status: "SCHEDULED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Design review",
        description: "Review new UI designs",
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
        location: "Conference Room B",
        status: "SCHEDULED" as const,
        provider: "GOOGLE" as const,
      },
      // Admin user events (admin@demo.com = users[4])
      {
        userId: users[4].id,
        title: "Product demo",
        description: "Demo new features to stakeholders",
        startTime: new Date(Date.now() + 7200000),
        endTime: new Date(Date.now() + 10800000),
        location: "Zoom",
        status: "CONFIRMED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[4].id,
        title: "Board meeting",
        description: "Quarterly board meeting",
        startTime: new Date(Date.now() + 172800000),
        endTime: new Date(Date.now() + 21600000),
        location: "Board Room",
        status: "SCHEDULED" as const,
        provider: "OUTLOOK" as const,
      },
    ];

    for (const event of events) {
      await prisma.calendarEvent.upsert({
        where: { id: event.title.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: event,
      });
    }

    // Create sample documents
    const documents = [
      {
        userId: users[0].id,
        title: "Project Proposal.pdf",
        filePath: "/uploads/project-proposal.pdf",
        fileType: "PDF",
        fileSize: BigInt(2500000),
        status: "INDEXED" as const,
      },
      {
        userId: users[0].id,
        title: "Meeting Notes.docx",
        filePath: "/uploads/meeting-notes.docx",
        fileType: "DOC",
        fileSize: BigInt(156000),
        status: "INDEXED" as const,
      },
      {
        userId: users[1].id,
        title: "Budget 2026.xlsx",
        filePath: "/uploads/budget-2026.xlsx",
        fileType: "XLS",
        fileSize: BigInt(890000),
        status: "INDEXED" as const,
      },
      {
        userId: users[2].id,
        title: "Contract Draft.pdf",
        filePath: "/uploads/contract-draft.pdf",
        fileType: "PDF",
        fileSize: BigInt(1200000),
        status: "PROCESSING" as const,
      },
      // Demo user documents (test@example.com = users[3])
      {
        userId: users[3].id,
        title: "Getting Started Guide.pdf",
        filePath: "/uploads/getting-started.pdf",
        fileType: "PDF",
        fileSize: BigInt(450000),
        status: "INDEXED" as const,
      },
      {
        userId: users[3].id,
        title: "Team Notes.docx",
        filePath: "/uploads/team-notes.docx",
        fileType: "DOC",
        fileSize: BigInt(89000),
        status: "INDEXED" as const,
      },
      // Admin user documents (admin@demo.com = users[4])
      {
        userId: users[4].id,
        title: "Q1 Report.pdf",
        filePath: "/uploads/q1-report.pdf",
        fileType: "PDF",
        fileSize: BigInt(1200000),
        status: "INDEXED" as const,
      },
      {
        userId: users[4].id,
        title: "Sales Dashboard.xlsx",
        filePath: "/uploads/sales-dashboard.xlsx",
        fileType: "XLS",
        fileSize: BigInt(750000),
        status: "INDEXED" as const,
      },
    ];

    for (const doc of documents) {
      await prisma.document.upsert({
        where: { id: doc.title.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: doc,
      });
    }

    // Create sample workflows
    const workflows = [
      {
        userId: users[4].id,
        name: "Welcome Message",
        type: "WELCOME",
        status: "ACTIVE",
        enabled: true,
        trigger: "user.signup",
        steps: JSON.stringify([
          { action: "send_message", template: "welcome" },
          { action: "wait", duration: 60000 },
          { action: "send_message", template: "features_intro" },
        ]),
      },
      {
        userId: users[4].id,
        name: "Reminder Follow-up",
        type: "REMINDER",
        status: "ACTIVE",
        enabled: true,
        schedule: "0 9 * * *",
        steps: JSON.stringify([
          { action: "query_pending_reminders" },
          { action: "send_reminder_notification" },
        ]),
      },
      {
        userId: users[4].id,
        name: "Payment Reminder",
        type: "SCHEDULED",
        status: "INACTIVE",
        enabled: false,
        schedule: "0 10 1 * *",
        steps: JSON.stringify([
          { action: "check_due_payments" },
          { action: "send_payment_reminder" },
        ]),
      },
      {
        userId: users[4].id,
        name: "Weekly Digest",
        type: "SCHEDULED",
        status: "ACTIVE",
        enabled: true,
        schedule: "0 18 * * 5",
        steps: JSON.stringify([
          { action: "compile_weekly_summary" },
          { action: "send_digest" },
        ]),
      },
    ];

    for (const workflow of workflows) {
      await prisma.workflow.upsert({
        where: { id: workflow.name.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: workflow,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sample data created successfully",
      data: {
        users: users.length,
        reminders: reminders.length,
        events: events.length,
        documents: documents.length,
        agents: agents.length,
        workflows: workflows.length,
      },
    });
  } catch (error) {
    console.error("Failed to seed data:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
