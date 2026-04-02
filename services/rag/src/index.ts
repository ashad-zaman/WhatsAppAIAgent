import { llmService, embeddingService, vectorService } from '@whatsapp-ai/ai';
import { graphQueries } from '@whatsapp-ai/database';
import { prisma } from '@whatsapp-ai/database';
import { config } from '@whatsapp-ai/config';
import { generateId, chunk } from '@whatsapp-ai/common';

export interface RAGQuery {
  query: string;
  userId: string;
  orgId?: string;
  documentIds?: string[];
  topK?: number;
  includeGraph?: boolean;
}

export interface RAGResult {
  answer: string;
  sources: Source[];
  context: {
    vectorResults: VectorResult[];
    graphResults: GraphContext;
  };
  metadata: {
    tokensUsed: number;
    latencyMs: number;
    model: string;
  };
}

export interface Source {
  documentId: string;
  chunkId: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorResult {
  id: string;
  score: number;
  text: string;
  documentId: string;
  metadata: Record<string, unknown>;
}

export interface GraphContext {
  documents: Record<string, unknown>[];
  topics: Record<string, unknown>[];
  entities: Record<string, unknown>[];
  relationships: { source: string; target: string; type: string }[];
}

export const SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base containing documents and information.

Your task is to:
1. Answer user questions based on the provided context
2. Cite your sources when referencing specific information
3. Be clear about when information is not in the context
4. Synthesize information from multiple sources when relevant

Guidelines:
- Always be truthful and only use information from the provided context
- If the context doesn't contain enough information, say so
- Use a conversational but professional tone
- Break down complex answers into digestible parts
- Highlight key findings from documents`;

export const chunkText = (text: string, chunkSize: number = 500, overlap: number = 50): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  let currentSize = 0;

  for (const sentence of sentences) {
    const sentenceSize = sentence.length;
    
    if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = currentChunk.slice(-overlap) + sentence;
      currentSize = currentChunk.length;
    } else {
      currentChunk += sentence;
      currentSize += sentenceSize;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

export const extractEntities = async (text: string): Promise<{
  entities: { name: string; type: string }[];
  topics: string[];
}> => {
  const prompt = `Extract named entities and topics from the following text.

Return a JSON object with:
{
  "entities": [{"name": "entity name", "type": "PERSON/ORG/LOCATION/DATE/NUMBER"}],
  "topics": ["topic1", "topic2", "topic3"]
}

Text: ${text.slice(0, 2000)}`;

  try {
    const response = await llmService.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0].message?.content || '{}';
    return JSON.parse(content);
  } catch {
    return { entities: [], topics: [] };
  }
};

export const searchVectorStore = async (
  query: string,
  userId: string,
  options?: {
    documentIds?: string[];
    topK?: number;
  }
): Promise<VectorResult[]> => {
  const filter: Record<string, unknown> = {
    must: [{ key: 'user_id', match: { value: userId } }],
  };

  if (options?.documentIds && options.documentIds.length > 0) {
    filter.must.push({
      key: 'document_id',
      match: { any: options.documentIds },
    });
  }

  const results = await vectorService.search('document_chunks', query, {
    limit: options?.topK || 10,
    filter,
  });

  return results.map((r) => ({
    id: r.id,
    score: r.score,
    text: r.payload.chunk_text as string,
    documentId: r.payload.document_id as string,
    metadata: r.payload,
  }));
};

export const searchGraphStore = async (
  query: string,
  userId: string
): Promise<GraphContext> => {
  try {
    const { entities, topics } = await extractEntities(query);
    const entityNames = entities.map((e) => e.name);

    let documents: Record<string, unknown>[] = [];
    let graphTopics: Record<string, unknown>[] = [];
    let graphEntities: Record<string, unknown>[] = [];
    let relationships: { source: string; target: string; type: string }[] = [];

    if (entityNames.length > 0) {
      documents = await graphQueries.searchByEntities(entityNames);
    }

    if (documents.length > 0) {
      const docId = documents[0].id as string;
      const context = await graphQueries.getDocumentContext(docId);
      graphTopics = context.topics;
      graphEntities = context.entities;
    }

    const knowledgeGraph = await graphQueries.getUserKnowledgeGraph(userId);
    
    if (knowledgeGraph.topics.length > 0) {
      graphTopics = [...new Map([...graphTopics, ...knowledgeGraph.topics].map((t) => [t.id, t])).values()];
    }

    return {
      documents: knowledgeGraph.documents,
      topics: graphTopics,
      entities: graphEntities,
      relationships,
    };
  } catch (error) {
    console.error('Graph search error:', error);
    return {
      documents: [],
      topics: [],
      entities: [],
      relationships: [],
    };
  }
};

export const generateAnswer = async (
  query: string,
  context: {
    vectorResults: VectorResult[];
    graphResults: GraphContext;
  },
  userId: string
): Promise<{ answer: string; sources: Source[]; tokensUsed: number }> => {
  let contextText = '';
  const sources: Source[] = [];

  if (context.vectorResults.length > 0) {
    contextText += '## Document Context\n\n';
    
    for (const result of context.vectorResults.slice(0, 5)) {
      const doc = await prisma.document.findUnique({
        where: { id: result.documentId },
        select: { title: true },
      });

      contextText += `[Document: ${doc?.title || 'Unknown'}]\n${result.text}\n\n`;
      
      sources.push({
        documentId: result.documentId,
        chunkId: result.id,
        text: result.text,
        score: result.score,
        metadata: result.metadata,
      });
    }
  }

  if (context.graphResults.topics.length > 0) {
    contextText += '## Related Topics\n';
    contextText += context.graphResults.topics.map((t) => `- ${t.name}`).join('\n') + '\n\n';
  }

  if (context.graphResults.documents.length > 0) {
    contextText += '## Related Documents\n';
    contextText += context.graphResults.documents.map((d) => `- ${d.title}`).join('\n') + '\n\n';
  }

  const prompt = `${SYSTEM_PROMPT}

User Question: ${query}

${contextText ? `Context:\n${contextText}` : 'No relevant context found.'}

Please provide a helpful answer based on the context above.`;

  const startTime = Date.now();
  
  const completion = await llmService.chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Based on the following context, answer the user's question.\n\nContext:\n${contextText}\n\nQuestion: ${query}` },
    ],
    temperature: 0.7,
  });

  const latencyMs = Date.now() - startTime;
  const answer = completion.choices[0].message?.content || '';
  const tokensUsed = completion.usage?.total_tokens || 0;

  return { answer, sources, tokensUsed };
};

export const ragPipeline = async (params: RAGQuery): Promise<RAGResult> => {
  const startTime = Date.now();

  const [vectorResults, graphResults] = await Promise.all([
    searchVectorStore(params.query, params.userId, {
      documentIds: params.documentIds,
      topK: params.topK || 10,
    }),
    params.includeGraph !== false ? searchGraphStore(params.query, params.userId) : {
      documents: [],
      topics: [],
      entities: [],
      relationships: [],
    },
  ]);

  const { answer, sources, tokensUsed } = await generateAnswer(
    params.query,
    { vectorResults, graphResults },
    params.userId
  );

  const latencyMs = Date.now() - startTime;

  return {
    answer,
    sources,
    context: {
      vectorResults,
      graphResults,
    },
    metadata: {
      tokensUsed,
      latencyMs,
      model: config.openai.model,
    },
  };
};

export const summarizeDocument = async (
  documentId: string,
  userId: string,
  options?: {
    maxLength?: number;
    format?: 'bullets' | 'paragraph' | 'full';
  }
): Promise<{ summary: string; keyPoints: string[]; metadata: Record<string, unknown> }> => {
  const chunks = await prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: 'asc' },
  });

  if (chunks.length === 0) {
    return {
      summary: 'No content found in document.',
      keyPoints: [],
      metadata: {},
    };
  }

  const fullText = chunks.map((c) => c.chunkText).join('\n\n');

  const format = options?.format || 'bullets';
  let summaryPrompt = '';

  switch (format) {
    case 'bullets':
      summaryPrompt = `Create a concise bullet-point summary of the following document. Extract the most important points.\n\nDocument:\n${fullText.slice(0, 8000)}`;
      break;
    case 'paragraph':
      summaryPrompt = `Write a concise paragraph summarizing the following document in 3-5 sentences.\n\nDocument:\n${fullText.slice(0, 8000)}`;
      break;
    case 'full':
      summaryPrompt = `Provide a comprehensive summary of the following document, including its main topics, key findings, and conclusions.\n\nDocument:\n${fullText.slice(0, 10000)}`;
      break;
  }

  const summaryResponse = await llmService.chatCompletion({
    messages: [{ role: 'user', content: summaryPrompt }],
    temperature: 0.5,
  });

  const summary = summaryResponse.choices[0].message?.content || '';

  let keyPoints: string[] = [];
  if (format === 'bullets') {
    keyPoints = summary.split('\n').filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'));
  }

  const metadata = {
    documentId,
    summaryLength: summary.length,
    chunksProcessed: chunks.length,
    format,
    generatedAt: new Date().toISOString(),
  };

  return { summary, keyPoints, metadata };
};

export const indexDocument = async (
  documentId: string,
  userId: string,
  text: string,
  metadata?: Record<string, unknown>
): Promise<{ chunkCount: number; embeddingsCreated: number }> => {
  const chunks = chunkText(text, 500, 50);
  
  const chunkRecords = chunks.map((chunkText, index) => ({
    id: generateId(),
    documentId,
    chunkIndex: index,
    chunkText,
    tokenCount: Math.ceil(chunkText.length / 4),
    metadata: metadata || {},
  }));

  await prisma.documentChunk.createMany({
    data: chunkRecords,
  });

  await vectorService.initializeCollection('document_chunks');

  const points = await Promise.all(
    chunkRecords.map(async (chunk) => ({
      id: chunk.id,
      vector: await embeddingService.createEmbedding(chunk.chunkText),
      payload: {
        document_id: documentId,
        user_id: userId,
        chunk_text: chunk.chunkText,
        chunk_index: chunk.chunkIndex,
        token_count: chunk.tokenCount,
        ...metadata,
      },
    }))
  );

  await vectorService.upsertPoints('document_chunks', points);

  const { entities, topics } = await extractEntities(text);

  for (const entity of entities) {
    await graphQueries.executeWrite(
      `MERGE (e:Entity {id: $entityId, name: $name, type: $type})
       WITH e
       MATCH (d:Document {id: $documentId})
       MERGE (e)-[:LINKED_TO]->(d)`,
      {
        entityId: generateId(),
        name: entity.name,
        type: entity.type,
        documentId,
      }
    );
  }

  for (const topic of topics) {
    await graphQueries.executeWrite(
      `MERGE (t:Topic {id: $topicId, name: $name})
       WITH t
       MATCH (d:Document {id: $documentId})
       MERGE (d)-[:HAS_TOPIC]->(t)`,
      {
        topicId: generateId(),
        name: topic,
        documentId,
      }
    );
  }

  return {
    chunkCount: chunks.length,
    embeddingsCreated: points.length,
  };
};

export default {
  ragPipeline,
  summarizeDocument,
  indexDocument,
  chunkText,
  extractEntities,
  searchVectorStore,
  searchGraphStore,
};
