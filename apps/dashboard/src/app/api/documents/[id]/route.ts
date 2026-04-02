import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        organization: { select: { id: true, name: true } },
        chunks: { orderBy: { chunkIndex: "asc" } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...document,
      fileSize: Number(document.fileSize),
    });
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    if (action === "delete") {
      await prisma.documentChunk.deleteMany({ where: { documentId: id } });
      await prisma.document.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      fileSize: Number(updated.fileSize),
    });
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.documentChunk.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
