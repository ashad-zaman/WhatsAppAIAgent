import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAgentLimit } from "@/../../packages/security/src/planAccess";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    const agents = await prisma.agent.findMany({
      where: orgId ? { orgId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const orgId = body.orgId || (await prisma.organization.findFirst())?.id;
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = (user?.plan || "free") as "free" | "pro" | "enterprise";

    const currentAgents = await prisma.agent.count({
      where: { orgId },
    });

    const agentCheck = checkAgentLimit(plan, currentAgents);
    if (!agentCheck.allowed) {
      return NextResponse.json(
        {
          error: `Agent limit reached (${agentCheck.max}). Upgrade to Pro for unlimited agents.`,
          upgradeUrl: "/pricing",
          current: agentCheck.current,
          max: agentCheck.max,
        },
        { status: 403 },
      );
    }

    const agent = await prisma.agent.create({
      data: {
        orgId,
        name: body.name,
        type: body.type,
        systemPrompt: body.systemPrompt || "",
        config: body.config || {},
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Failed to create agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 },
    );
  }
}
