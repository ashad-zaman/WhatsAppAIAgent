import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") || body.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { query, documentIds, topK = 5, includeGraph = true } = body;

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    let vectorResults: {
      id: string;
      score: number;
      text: string;
      documentId: string;
    }[] = [];

    let graphResults = {
      documents: [],
      topics: [],
      entities: [],
      relationships: [],
    };

    if (documentIds && documentIds.length > 0) {
      const chunks = await prisma.documentChunk.findMany({
        where: {
          documentId: { in: documentIds },
        },
        take: topK * 2,
        orderBy: { chunkIndex: "asc" },
      });

      vectorResults = chunks.map((chunk) => ({
        id: chunk.id,
        score: 1,
        text: chunk.chunkText,
        documentId: chunk.documentId,
      }));
    } else {
      const chunks = await prisma.documentChunk.findMany({
        where: {
          document: { userId },
        },
        take: topK * 2,
        orderBy: { chunkIndex: "asc" },
      });

      vectorResults = chunks.map((chunk) => ({
        id: chunk.id,
        score: 1,
        text: chunk.chunkText,
        documentId: chunk.documentId,
      }));
    }

    const contextText = vectorResults
      .slice(0, topK)
      .map((r) => r.text)
      .join("\n\n");

    const systemPrompt = `You are a helpful AI assistant with access to a knowledge base containing documents.
    
Guidelines:
- Answer based on the provided context
- Cite sources when referencing specific information
- Be clear about when information is not in the context
- Use a conversational but professional tone`;

    const llmResponse = await fetch(
      `${process.env.LLM_API_URL || "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Based on the following context, answer the user's question.\n\nContext:\n${contextText}\n\nQuestion: ${query}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      },
    );

    let answer = "I found relevant information in your documents.";
    let tokensUsed = 0;

    if (llmResponse.ok) {
      const data = await llmResponse.json();
      answer = data.choices?.[0]?.message?.content || answer;
      tokensUsed = data.usage?.total_tokens || 0;
    }

    const sources = await Promise.all(
      vectorResults.slice(0, topK).map(async (result) => {
        const doc = await prisma.document.findUnique({
          where: { id: result.documentId },
          select: { title: true },
        });
        return {
          documentId: result.documentId,
          chunkId: result.id,
          text: result.text.substring(0, 200) + "...",
          score: result.score,
          documentTitle: doc?.title || "Unknown",
        };
      }),
    );

    return NextResponse.json({
      answer,
      sources,
      context: {
        vectorResults: vectorResults.slice(0, topK),
        graphResults,
      },
      metadata: {
        tokensUsed,
        chunksSearched: vectorResults.length,
        model: "gpt-4o-mini",
      },
    });
  } catch (error) {
    console.error("RAG query failed:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const documentId = searchParams.get("documentId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const whereClause: Record<string, unknown> = {};

    if (documentId) {
      whereClause.documentId = documentId;
    } else {
      whereClause.document = { userId };
    }

    const chunks = await prisma.documentChunk.findMany({
      where: whereClause,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            fileType: true,
          },
        },
      },
      orderBy: { chunkIndex: "asc" },
    });

    return NextResponse.json({
      chunks: chunks.map((c) => ({
        id: c.id,
        documentId: c.documentId,
        documentTitle: c.document.title,
        chunkIndex: c.chunkIndex,
        text: c.chunkText,
        tokenCount: c.tokenCount,
      })),
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error("Failed to fetch chunks:", error);
    return NextResponse.json(
      { error: "Failed to fetch chunks" },
      { status: 500 },
    );
  }
}
