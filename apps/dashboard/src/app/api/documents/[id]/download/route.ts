import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile, stat } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const fileType = document.fileType.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };

    const contentType = contentTypes[fileType] || "application/octet-stream";
    const safeTitle = document.title.replace(/[^a-zA-Z0-9.-]/g, "_");

    const filePath = document.filePath;
    if (filePath && filePath.startsWith("/uploads/")) {
      const fullPath = path.join(process.cwd(), "public", filePath);
      const fileExists = existsSync(fullPath);

      if (fileExists) {
        const fileBuffer = await readFile(fullPath);
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${safeTitle}.${fileType}"`,
          },
        });
      }
    }

    const sampleContent: Record<string, string> = {
      pdf: "%PDF-1.4 Sample PDF Content",
      xlsx: "Title,Description,Status\nProject Proposal,Initial proposal,Active",
      csv: "Name,Value,Date\nSample1,100,2024-01-01",
      docx: "Sample document content",
      jpg: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      jpeg: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      png: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      gif: "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
    };

    const isImage = ["jpg", "jpeg", "png", "gif"].includes(fileType);
    const content = sampleContent[fileType] || "Sample file content";

    if (isImage) {
      const buffer = Buffer.from(content, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${safeTitle}.${fileType}"`,
        },
      });
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeTitle}.${fileType}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download document:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 },
    );
  }
}
