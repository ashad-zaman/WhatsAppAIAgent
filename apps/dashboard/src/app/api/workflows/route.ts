import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { name, type, schedule, trigger, steps, enabled = true } = body;

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name,
        type: type || "CUSTOM",
        schedule: schedule || null,
        trigger: trigger || null,
        steps: steps || [],
        enabled,
        status: "INACTIVE",
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { workflowId, action, ...updates } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID required" },
        { status: 400 },
      );
    }

    let result;

    switch (action) {
      case "toggle":
        result = await prisma.workflow.update({
          where: { id: workflowId },
          data: { enabled: updates.enabled },
        });
        break;
      case "run":
        result = await prisma.workflow.update({
          where: { id: workflowId },
          data: { status: "RUNNING", lastRunAt: new Date() },
        });

        await prisma.workflowExecution.create({
          data: {
            workflowId,
            status: "STARTED",
            startedAt: new Date(),
          },
        });
        break;
      default:
        result = await prisma.workflow.update({
          where: { id: workflowId },
          data: updates,
        });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID required" },
        { status: 400 },
      );
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 },
    );
  }
}
