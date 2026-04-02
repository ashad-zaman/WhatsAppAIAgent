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

    // Create AI Agents for Admin
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

    // Create more agents for admin (organization level)
    const adminAgents = [
      {
        orgId: org.id,
        name: "Customer Support Agent",
        type: "CONVERSATION" as const,
        systemPrompt:
          "You are a customer support agent that handles user inquiries and provides assistance.",
        isActive: true,
        config: { language: "en", responseTime: "fast" },
      },
      {
        orgId: org.id,
        name: "Sales Bot",
        type: "CONVERSATION" as const,
        systemPrompt:
          "You are a sales assistant that helps generate leads and answer product questions.",
        isActive: true,
        config: { productInfo: "premium", followUp: true },
      },
      {
        orgId: org.id,
        name: "HR Assistant",
        type: "REMINDER" as const,
        systemPrompt:
          "You are an HR assistant that helps with employee onboarding and HR reminders.",
        isActive: true,
        config: { department: "HR" },
      },
      {
        orgId: org.id,
        name: "Meeting Scheduler",
        type: "CALENDAR" as const,
        systemPrompt:
          "You are a meeting scheduler assistant that helps coordinate meetings across time zones.",
        isActive: true,
        config: { autoSuggest: true },
      },
      {
        orgId: org.id,
        name: "Document Q&A",
        type: "DOCUMENT" as const,
        systemPrompt:
          "You are a document Q&A assistant that answers questions based on uploaded documents.",
        isActive: true,
        config: { maxTokens: 1000 },
      },
    ];

    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.name.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: agent,
      });
    }

    // Create admin organization agents
    for (const agent of adminAgents) {
      const agentId = `org-${agent.name.toLowerCase().replace(/\s+/g, "-")}`;
      await prisma.agent.upsert({
        where: { id: agentId },
        update: {},
        create: {
          ...agent,
          id: agentId,
        },
      });
    }

    // Create admin user agents
    for (const agent of adminAgents) {
      const agentId = `admin-${agent.name.toLowerCase().replace(/\s+/g, "-")}`;
      await prisma.agent.upsert({
        where: { id: agentId },
        update: {},
        create: agent,
      });
    }

    // Create admin user agents
    for (const agent of adminAgents) {
      await prisma.agent.upsert({
        where: { id: `admin-${agent.name.toLowerCase().replace(/\s+/g, "-")}` },
        update: {},
        create: {
          ...agent,
          id: `admin-${agent.name.toLowerCase().replace(/\s+/g, "-")}`,
        },
      });
    }

    // Create sample reminders (past and future)
    const reminders = [
      // Future reminders
      {
        userId: users[3].id,
        title: "Team standup meeting",
        scheduledAt: new Date(Date.now() + 3600000),
        status: "PENDING" as const,
        repeatType: "DAILY" as const,
      },
      {
        userId: users[3].id,
        title: "Call mom",
        scheduledAt: new Date(Date.now() + 7200000),
        status: "PENDING" as const,
        repeatType: "WEEKLY" as const,
      },
      {
        userId: users[3].id,
        title: "Gym session",
        scheduledAt: new Date(Date.now() + 86400000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[3].id,
        title: "Dentist appointment",
        scheduledAt: new Date(Date.now() + 172800000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[3].id,
        title: "Weekly planning",
        scheduledAt: new Date(Date.now() + 259200000),
        status: "PENDING" as const,
        repeatType: "WEEKLY" as const,
      },
      // Past reminders (completed)
      {
        userId: users[3].id,
        title: "Submit project report",
        scheduledAt: new Date(Date.now() - 86400000),
        status: "COMPLETED" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[3].id,
        title: "Client presentation prep",
        scheduledAt: new Date(Date.now() - 172800000),
        status: "COMPLETED" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[3].id,
        title: "Morning meditation",
        scheduledAt: new Date(Date.now() - 259200000),
        status: "COMPLETED" as const,
        repeatType: "DAILY" as const,
      },
      {
        userId: users[3].id,
        title: "Monthly bill payment",
        scheduledAt: new Date(Date.now() - 432000000),
        status: "COMPLETED" as const,
        repeatType: "MONTHLY" as const,
      },
      // Call reminders
      {
        userId: users[3].id,
        title: "Call doctor",
        scheduledAt: new Date(Date.now() + 43200000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
      {
        userId: users[3].id,
        title: "Video call with team",
        scheduledAt: new Date(Date.now() + 21600000),
        status: "PENDING" as const,
        repeatType: "NONE" as const,
      },
    ];

    for (const reminder of reminders) {
      await prisma.reminder.upsert({
        where: {
          id: `${reminder.title.toLowerCase().replace(/\s+/g, "-")}-${reminder.userId.slice(0, 8)}`,
        },
        update: {},
        create: reminder,
      });
    }

    // Create sample calendar events (past and future)
    const now = Date.now();
    const events = [
      // Future events
      {
        userId: users[3].id,
        title: "Team standup",
        description: "Daily team sync meeting",
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 5400000),
        location: "Google Meet",
        status: "SCHEDULED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Project review",
        description: "Q1 milestone review",
        startTime: new Date(now + 86400000),
        endTime: new Date(now + 90000000),
        location: "Conference Room A",
        status: "SCHEDULED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Client presentation",
        description: "Quarterly business review",
        startTime: new Date(now + 172800000),
        endTime: new Date(now + 180000000),
        location: "Zoom",
        status: "CONFIRMED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Design sprint planning",
        description: "Plan next sprint design tasks",
        startTime: new Date(now + 259200000),
        endTime: new Date(now + 270000000),
        location: "Conference Room B",
        status: "SCHEDULED" as const,
        provider: "OUTLOOK" as const,
      },
      {
        userId: users[3].id,
        title: "One-on-one with manager",
        description: "Weekly sync with manager",
        startTime: new Date(now + 43200000),
        endTime: new Date(now + 45000000),
        location: "Manager's office",
        status: "SCHEDULED" as const,
        provider: "GOOGLE" as const,
      },
      // Past events (completed - using CANCELLED as status for past)
      {
        userId: users[3].id,
        title: "Team lunch",
        description: "Team building lunch",
        startTime: new Date(now - 86400000),
        endTime: new Date(now - 82800000),
        location: "Restaurant XYZ",
        status: "CANCELLED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Product demo",
        description: "Demo new features to stakeholders",
        startTime: new Date(now - 172800000),
        endTime: new Date(now - 169200000),
        location: "Zoom",
        status: "CANCELLED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Sprint retrospective",
        description: "Review last sprint",
        startTime: new Date(now - 259200000),
        endTime: new Date(now - 252000000),
        location: "Conference Room A",
        status: "CANCELLED" as const,
        provider: "OUTLOOK" as const,
      },
      {
        userId: users[3].id,
        title: "Training session",
        description: "New tool training",
        startTime: new Date(now - 432000000),
        endTime: new Date(now - 421200000),
        location: "Training Room",
        status: "CANCELLED" as const,
        provider: "GOOGLE" as const,
      },
      {
        userId: users[3].id,
        title: "Monthly all-hands",
        description: "Company monthly meeting",
        startTime: new Date(now - 604800000),
        endTime: new Date(now - 597000000),
        location: "Main Hall",
        status: "CANCELLED" as const,
        provider: "GOOGLE" as const,
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
      {
        userId: users[3].id,
        title: "Q1 Report.pdf",
        filePath: "/uploads/q1-report.pdf",
        fileType: "PDF",
        fileSize: BigInt(1200000),
        status: "INDEXED" as const,
      },
      {
        userId: users[3].id,
        title: "Sales Dashboard.xlsx",
        filePath: "/uploads/sales-dashboard.xlsx",
        fileType: "XLS",
        fileSize: BigInt(750000),
        status: "INDEXED" as const,
      },
      {
        userId: users[3].id,
        title: "Meeting Notes.pdf",
        filePath: "/uploads/meeting-notes.pdf",
        fileType: "PDF",
        fileSize: BigInt(320000),
        status: "INDEXED" as const,
      },
      {
        userId: users[3].id,
        title: "Project Roadmap.docx",
        filePath: "/uploads/project-roadmap.docx",
        fileType: "DOC",
        fileSize: BigInt(156000),
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

    return NextResponse.json({
      success: true,
      message: "Sample data created successfully",
      data: {
        users: users.length,
        reminders: reminders.length,
        events: events.length,
        documents: documents.length,
        agents: agents.length + adminAgents.length,
        workflows: 0,
      },
    });
  } catch (error) {
    console.error("Failed to seed data:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
