import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const where = userId ? { userId } : {};

    const documents = await prisma.document.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const serialized = documents.map((doc) => ({
      ...doc,
      fileSize: Number(doc.fileSize),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    const newDocument = await prisma.document.create({
      data: {
        userId,
        orgId: body.orgId,
        title: body.title || body.name,
        filePath: body.filePath || `/uploads/${Date.now()}-${body.name}`,
        fileType: body.fileType || body.type || "PDF",
        fileSize: BigInt(body.fileSize || 0),
        version: 1,
        metadata: body.metadata || {},
        status: "PROCESSING",
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
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, documentId, ...params } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 },
      );
    }

    const userId = request.headers.get("x-user-id") || params.userId;

    switch (action) {
      case "index": {
        const document = await prisma.document.findUnique({
          where: { id: documentId },
        });

        if (!document) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }

        const chunks = await prisma.documentChunk.findMany({
          where: { documentId },
        });

        if (chunks.length === 0) {
          return NextResponse.json(
            { error: "Document has no content to index" },
            { status: 400 },
          );
        }

        await prisma.document.update({
          where: { id: documentId },
          data: { status: "INDEXED" },
        });

        return NextResponse.json({
          success: true,
          message: "Document indexed successfully",
          chunkCount: chunks.length,
        });
      }

      case "summarize": {
        const document = await prisma.document.findUnique({
          where: { id: documentId },
        });

        if (!document) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }

        const chunks = await prisma.documentChunk.findMany({
          where: { documentId },
          orderBy: { chunkIndex: "asc" },
        });

        if (chunks.length === 0) {
          return NextResponse.json(
            { error: "Document has no content to summarize" },
            { status: 400 },
          );
        }

        return NextResponse.json({
          documentId,
          title: document.title,
          status: document.status,
          chunkCount: chunks.length,
          totalTextLength: chunks.reduce(
            (sum, c) => sum + c.chunkText.length,
            0,
          ),
          message: "Use the RAG query endpoint to generate a summary",
        });
      }

      case "delete": {
        await prisma.documentChunk.deleteMany({ where: { documentId } });
        await prisma.document.delete({ where: { id: documentId } });

        return NextResponse.json({
          success: true,
          message: "Document deleted",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to process document:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 },
    );
  }
}
