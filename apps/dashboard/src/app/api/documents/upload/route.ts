import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { checkDocumentStorage } from "@/../../packages/security/src/planAccess";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId =
      request.headers.get("x-user-id") || (formData.get("userId") as string);
    const title = (formData.get("title") as string) || "Untitled";
    const description = (formData.get("description") as string) || "";
    const orgId = formData.get("orgId") as string;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = (user?.plan || "free") as "free" | "pro" | "enterprise";

    const currentDocs = await prisma.document.findMany({
      where: { userId },
      select: { fileSize: true },
    });

    const currentSizeMB = currentDocs.reduce((total, doc) => {
      return total + Number(doc.fileSize) / (1024 * 1024);
    }, 0);

    let newFileSizeMB = 0;
    if (file) {
      newFileSizeMB = file.size / (1024 * 1024);
    }

    const storageCheck = checkDocumentStorage(
      plan,
      Math.floor(currentSizeMB + newFileSizeMB),
    );
    if (!storageCheck.allowed) {
      return NextResponse.json(
        {
          error: `Storage limit reached. Upgrade to Pro for more storage.`,
          upgradeUrl: "/pricing",
          used: Math.floor(currentSizeMB),
          limit: storageCheck.remaining,
        },
        { status: 403 },
      );
    }

    let fileSize = 0;
    let fileType = "PDF";
    let filePath = "";

    if (file) {
      fileSize = file.size;
      const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
      fileType = ext;

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      filePath = `/uploads/${fileName}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadsDir, fileName), buffer);
    }

    let finalOrgId = orgId;
    if (!finalOrgId) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
      });
      finalOrgId = membership?.orgId || "";
    }

    const newDocument = await prisma.document.create({
      data: {
        userId,
        orgId: finalOrgId,
        title,
        filePath: filePath || `/uploads/${Date.now()}-${title}`,
        fileType,
        fileSize: BigInt(fileSize),
        version: 1,
        metadata: { description },
        status: file ? "INDEXED" : "PROCESSING",
      },
    });

    return NextResponse.json(
      {
        ...newDocument,
        fileSize: Number(newDocument.fileSize),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to upload document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}
