import { QdrantClient } from '@qdrant/qdrant-js';
import { embeddingService } from './openai';
import { config } from '@whatsapp-ai/config';

let qdrantClient: QdrantClient | null = null;

export const getVectorClient = (): QdrantClient => {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: config.vectorDb.url,
      apiKey: config.vectorDb.apiKey,
    });
  }
  return qdrantClient;
};

export const COLLECTIONS = {
  DOCUMENT_CHUNKS: 'document_chunks',
  USER_MESSAGES: 'user_messages',
  AGENT_MEMORY: 'agent_memory',
} as const;

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export const vectorService = {
  async initializeCollection(name: string, vectorSize: number = config.vectorDb.dimensions): Promise<void> {
    const client = getVectorClient();
    
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === name);

    if (!exists) {
      await client.createCollection(name, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
      console.log(`Collection ${name} created`);
    }
  },

  async upsertPoints(
    collectionName: string,
    points: VectorPoint[]
  ): Promise<void> {
    const client = getVectorClient();
    await client.upsert(collectionName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  },

  async search(
    collectionName: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      filter?: Record<string, unknown>;
      scoreThreshold?: number;
    }
  ): Promise<{ id: string; score: number; payload: Record<string, unknown> }[]> {
    const client = getVectorClient();
    const queryVector = await embeddingService.createEmbedding(query);

    const results = await client.search(collectionName, {
      vector: queryVector,
      limit: options?.limit || 10,
      offset: options?.offset,
      filter: options?.filter,
      score_threshold: options?.scoreThreshold,
      with_payload: true,
    });

    return results.map((r) => ({
      id: r.id as string,
      score: r.score,
      payload: r.payload as Record<string, unknown>,
    }));
  },

  async searchBatch(
    collectionName: string,
    queries: string[],
    options?: { limit?: number; filter?: Record<string, unknown> }
  ): Promise<{ id: string; score: number; payload: Record<string, unknown> }[][]> {
    const client = getVectorClient();
    const queryVectors = await embeddingService.createEmbeddings(queries);

    const results = await client.searchBatch(collectionName, {
      searches: queryVectors.map((vector) => ({
        vector,
        limit: options?.limit || 10,
        filter: options?.filter,
        with_payload: true,
      })),
    });

    return results.map((batch) =>
      batch.map((r) => ({
        id: r.id as string,
        score: r.score,
        payload: r.payload as Record<string, unknown>,
      }))
    );
  },

  async deletePoints(collectionName: string, ids: string[]): Promise<void> {
    const client = getVectorClient();
    await client.delete(collectionName, {
      points: ids,
    });
  },

  async deleteByFilter(collectionName: string, filter: Record<string, unknown>): Promise<void> {
    const client = getVectorClient();
    await client.delete(collectionName, {
      filter: filter as never,
    });
  },

  async getPoints(collectionName: string, ids: string[]): Promise<VectorPoint[]> {
    const client = getVectorClient();
    const results = await client.retrieve(collectionName, {
      ids: ids.map((id) => id as never),
      with_payload: true,
    });

    return results.map((r) => ({
      id: r.id as string,
      vector: [], 
      payload: r.payload as Record<string, unknown>,
    }));
  },

  async count(collectionName: string, filter?: Record<string, unknown>): Promise<number> {
    const client = getVectorClient();
    const result = await client.getCollection(collectionName);
    return result.points_count;
  },
};

export const documentIndexing = {
  async indexDocument(
    documentId: string,
    userId: string,
    chunks: { id: string; text: string; metadata?: Record<string, unknown> }[]
  ): Promise<void> {
    await vectorService.initializeCollection(COLLECTIONS.DOCUMENT_CHUNKS);

    const points = await Promise.all(
      chunks.map(async (chunk) => ({
        id: chunk.id,
        vector: await embeddingService.createEmbedding(chunk.text),
        payload: {
          document_id: documentId,
          user_id: userId,
          chunk_text: chunk.text,
          chunk_index: chunk.metadata?.chunkIndex || 0,
          ...chunk.metadata,
        },
      }))
    );

    await vectorService.upsertPoints(COLLECTIONS.DOCUMENT_CHUNKS, points);
  },

  async searchDocuments(
    query: string,
    userId: string,
    options?: {
      limit?: number;
      documentIds?: string[];
      topics?: string[];
    }
  ): Promise<{ documentId: string; chunkId: string; text: string; score: number; metadata: Record<string, unknown> }[]> {
    const filter: Record<string, unknown> = {
      must: [
        { key: 'user_id', match: { value: userId } },
      ],
    };

    if (options?.documentIds) {
      filter.must.push({
        key: 'document_id',
        match: { any: options.documentIds },
      });
    }

    if (options?.topics) {
      filter.must.push({
        key: 'topics',
        match: { any: options.topics },
      });
    }

    const results = await vectorService.search(COLLECTIONS.DOCUMENT_CHUNKS, query, {
      limit: options?.limit || 10,
      filter,
    });

    return results.map((r) => ({
      documentId: r.payload.document_id as string,
      chunkId: r.id,
      text: r.payload.chunk_text as string,
      score: r.score,
      metadata: r.payload,
    }));
  },

  async deleteDocumentChunks(documentId: string): Promise<void> {
    await vectorService.deleteByFilter(COLLECTIONS.DOCUMENT_CHUNKS, {
      key: 'document_id',
      match: { value: documentId },
    });
  },
};

export const messageIndexing = {
  async indexMessage(
    messageId: string,
    userId: string,
    conversationId: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await vectorService.initializeCollection(COLLECTIONS.USER_MESSAGES);

    const point = {
      id: messageId,
      vector: await embeddingService.createEmbedding(text),
      payload: {
        user_id: userId,
        conversation_id: conversationId,
        message_text: text,
        created_at: new Date().toISOString(),
        ...metadata,
      },
    };

    await vectorService.upsertPoints(COLLECTIONS.USER_MESSAGES, [point]);
  },

  async searchMessages(
    query: string,
    userId: string,
    options?: { limit?: number; conversationId?: string }
  ): Promise<{ messageId: string; text: string; conversationId: string; score: number }[]> {
    const filter: Record<string, unknown> = {
      must: [{ key: 'user_id', match: { value: userId } }],
    };

    if (options?.conversationId) {
      filter.must.push({ key: 'conversation_id', match: { value: options.conversationId } });
    }

    const results = await vectorService.search(COLLECTIONS.USER_MESSAGES, query, {
      limit: options?.limit || 10,
      filter,
    });

    return results.map((r) => ({
      messageId: r.id,
      text: r.payload.message_text as string,
      conversationId: r.payload.conversation_id as string,
      score: r.score,
    }));
  },
};

export default {
  getClient: getVectorClient,
  service: vectorService,
  collections: COLLECTIONS,
  documentIndexing,
  messageIndexing,
};
