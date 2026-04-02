import neo4j, { Driver, Session as Neo4jSession, Result } from 'neo4j-driver';
import { config } from '@whatsapp-ai/config';

let driver: Driver | null = null;

export const connectNeo4j = async (): Promise<Driver> => {
  if (driver) return driver;

  try {
    driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000,
      }
    );

    await driver.verifyConnectivity();
    console.log('Neo4j connected successfully');
    return driver;
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
    throw error;
  }
};

export const disconnectNeo4j = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j disconnected');
  }
};

export const getNeo4jDriver = (): Driver => {
  if (!driver) {
    throw new Error('Neo4j not connected. Call connectNeo4j() first.');
  }
  return driver;
};

export const executeQuery = async <T = Record<string, unknown>>(
  cypher: string,
  params?: Record<string, unknown>
): Promise<T[]> => {
  const session: Neo4jSession = getNeo4jDriver().session();
  try {
    const result: Result = await session.run(cypher, params);
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key) => {
        const value = record.get(key);
        obj[key as string] = convertNeo4jValue(value);
      });
      return obj as T;
    });
  } finally {
    await session.close();
  }
};

export const executeWrite = async <T = Record<string, unknown>>(
  cypher: string,
  params?: Record<string, unknown>
): Promise<T[]> => {
  const session: Neo4jSession = getNeo4jDriver().session();
  try {
    const result = await session.executeWrite(async (tx) => {
      return tx.run(cypher, params);
    });
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key) => {
        const value = record.get(key);
        obj[key as string] = convertNeo4jValue(value);
      });
      return obj as T;
    });
  } finally {
    await session.close();
  }
};

function convertNeo4jValue(value: unknown): unknown {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }
  if (neo4j.isDate(value) || neo4j.isDateTime(value) || neo4j.isLocalDateTime(value)) {
    return new Date(value.toString());
  }
  if (neo4j.isDuration(value)) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(convertNeo4jValue);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      obj[k] = convertNeo4jValue(v);
    }
    return obj;
  }
  return value;
}

export const graphQueries = {
  async createUserNode(userId: string, properties: Record<string, unknown>): Promise<void> {
    await executeWrite(
      `CREATE (u:User {id: $userId, ...$properties})
       RETURN u`,
      { userId, properties }
    );
  },

  async createDocumentNode(documentId: string, properties: Record<string, unknown>): Promise<void> {
    await executeWrite(
      `CREATE (d:Document {id: $documentId, ...$properties})
       RETURN d`,
      { documentId, properties }
    );
  },

  async createProjectNode(projectId: string, properties: Record<string, unknown>): Promise<void> {
    await executeWrite(
      `CREATE (p:Project {id: $projectId, ...$properties})
       RETURN p`,
      { projectId, properties }
    );
  },

  async createTopicNode(topicId: string, properties: Record<string, unknown>): Promise<void> {
    await executeWrite(
      `CREATE (t:Topic {id: $topicId, ...$properties})
       RETURN t`,
      { topicId, properties }
    );
  },

  async createEntityNode(entityId: string, properties: Record<string, unknown>): Promise<void> {
    await executeWrite(
      `CREATE (e:Entity {id: $entityId, ...$properties})
       RETURN e`,
      { entityId, properties }
    );
  },

  async linkDocumentToProject(documentId: string, projectId: string): Promise<void> {
    await executeWrite(
      `MATCH (d:Document {id: $documentId})
       MATCH (p:Project {id: $projectId})
       CREATE (d)-[:BELONGS_TO]->(p)
       RETURN d, p`,
      { documentId, projectId }
    );
  },

  async linkDocumentToUser(documentId: string, userId: string): Promise<void> {
    await executeWrite(
      `MATCH (d:Document {id: $documentId})
       MATCH (u:User {id: $userId})
       CREATE (u)-[:OWNS]->(d)
       RETURN d, u`,
      { documentId, userId }
    );
  },

  async linkDocumentsByTopic(documentId1: string, documentId2: string, topicId: string): Promise<void> {
    await executeWrite(
      `MATCH (d1:Document {id: $documentId1})
       MATCH (d2:Document {id: $documentId2})
       MATCH (t:Topic {id: $topicId})
       CREATE (d1)-[:HAS_TOPIC]->(t)
       CREATE (d2)-[:HAS_TOPIC]->(t)
       RETURN d1, d2, t`,
      { documentId1, documentId2, topicId }
    );
  },

  async linkEntityToDocument(entityId: string, documentId: string): Promise<void> {
    await executeWrite(
      `MATCH (e:Entity {id: $entityId})
       MATCH (d:Document {id: $documentId})
       CREATE (e)-[:LINKED_TO]->(d)
       RETURN e, d`,
      { entityId, documentId }
    );
  },

  async linkUserToProject(userId: string, projectId: string): Promise<void> {
    await executeWrite(
      `MATCH (u:User {id: $userId})
       MATCH (p:Project {id: $projectId})
       CREATE (u)-[:MEMBER_OF]->(p)
       RETURN u, p`,
      { userId, projectId }
    );
  },

  async getDocumentContext(documentId: string): Promise<{
    document: Record<string, unknown>;
    projects: Record<string, unknown>[];
    topics: Record<string, unknown>[];
    entities: Record<string, unknown>[];
  }> {
    const results = await executeQuery<{
      d: Record<string, unknown>;
      p: Record<string, unknown>;
      t: Record<string, unknown>;
      e: Record<string, unknown>;
    }>(
      `MATCH (d:Document {id: $documentId})
       OPTIONAL MATCH (d)-[:BELONGS_TO]->(p:Project)
       OPTIONAL MATCH (d)-[:HAS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (e:Entity)-[:LINKED_TO]->(d)
       RETURN d, p, t, e`,
      { documentId }
    );

    if (results.length === 0) {
      return { document: {}, projects: [], topics: [], entities: [] };
    }

    const firstResult = results[0];
    return {
      document: firstResult.d || {},
      projects: results.filter((r) => r.p).map((r) => r.p),
      topics: results.filter((r) => r.t).map((r) => r.t),
      entities: results.filter((r) => r.e).map((r) => r.e),
    };
  },

  async getRelatedDocuments(documentId: string, limit: number = 10): Promise<Record<string, unknown>[]> {
    const results = await executeQuery<{ related: Record<string, unknown>; topic: Record<string, unknown> }>(
      `MATCH (d:Document {id: $documentId})-[:HAS_TOPIC]->(t:Topic)<-[:HAS_TOPIC]-(related:Document)
       WHERE related.id <> $documentId
       WITH related, t, count {{}} as score
       ORDER BY score DESC
       LIMIT $limit
       RETURN related, t`,
      { documentId, limit }
    );
    return results.map((r) => r.related);
  },

  async getUserKnowledgeGraph(userId: string): Promise<{
    documents: Record<string, unknown>[];
    projects: Record<string, unknown>[];
    topics: Record<string, unknown>[];
  }> {
    const results = await executeQuery<{
      d: Record<string, unknown>;
      p: Record<string, unknown>;
      t: Record<string, unknown>;
    }>(
      `MATCH (u:User {id: $userId})-[:OWNS|MEMBER_OF*1..2]-(connected)
       OPTIONAL MATCH (connected)-[:BELONGS_TO|HAS_TOPIC]-(related)
       RETURN DISTINCT connected as d, related as p, null as t
       UNION
       MATCH (u:User {id: $userId})-[:OWNS|MEMBER_OF*1..2]-(connected)-[:HAS_TOPIC]-(t:Topic)
       RETURN DISTINCT connected as d, null as p, t`,
      { userId }
    );

    return {
      documents: [...new Map(results.filter((r) => r.d && !r.d.type).map((r) => [r.d.id, r.d])).values()],
      projects: [...new Map(results.filter((r) => r.p).map((r) => [r.p.id, r.p])).values()],
      topics: [...new Map(results.filter((r) => r.t).map((r) => [r.t.id, r.t])).values()],
    };
  },

  async searchByEntities(entityNames: string[]): Promise<Record<string, unknown>[]> {
    const results = await executeQuery<{ document: Record<string, unknown> }>(
      `MATCH (e:Entity)-[:LINKED_TO|MENTIONED_IN]-(connected)
       WHERE e.name IN $entityNames
       AND (connected:Document OR connected:Reminder)
       RETURN DISTINCT connected as document`,
      { entityNames }
    );
    return results.map((r) => r.document);
  },
};

export default {
  connect: connectNeo4j,
  disconnect: disconnectNeo4j,
  getDriver: getNeo4jDriver,
  executeQuery,
  executeWrite,
  queries: graphQueries,
};
