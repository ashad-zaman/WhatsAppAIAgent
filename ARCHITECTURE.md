# WhatsApp AI Agent Platform - Production Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   WhatsApp      │  │   Web Dashboard  │  │   Mobile App     │                  │
│  │   (Cloud API)   │  │   (Next.js)     │  │   (React Native) │                  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                  │
└───────────┼───────────────────┼───────────────────┼──────────────────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Kong/NGINX)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Rate Limiting │ Auth │ Load Balancing │ WebSocket │ SSL Termination   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MESSAGE BUS (Kafka / RabbitMQ)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ messages  │ │  events  │ │  tasks   │ │notifs    │ │  logs    │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
            │
    ┌───────┴────────────────────────────────────────────────────────┐
    │                      MICROSERVICES CLUSTER                       │
    │  ┌─────────────────────────────────────────────────────────┐    │
    │  │                    CORE SERVICES                         │    │
    │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
    │  │  │ Auth Svc   │ │ User Svc   │ │ Billing Svc │            │    │
    │  │  └────────────┘ └────────────┘ └────────────┘            │    │
    │  └─────────────────────────────────────────────────────────┘    │
    │  ┌─────────────────────────────────────────────────────────┐    │
    │  │                 AI & AGENT LAYER                        │    │
    │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
    │  │  │ Reminder   │ │ Calendar   │ │ Document   │            │    │
    │  │  │ Agent      │ │ Agent      │ │ Agent      │            │    │
    │  │  └────────────┘ └────────────┘ └────────────┘            │    │
    │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
    │  │  │Conversation│ │ Voice      │ │ Workflow   │            │    │
    │  │  │ Agent      │ │ Agent      │ │ Orchestrator│           │    │
    │  │  └────────────┘ └────────────┘ └────────────┘            │    │
    │  └─────────────────────────────────────────────────────────┘    │
    │  ┌─────────────────────────────────────────────────────────┐    │
    │  │                   DATA LAYER                             │    │
    │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
    │  │  │ PostgreSQL │ │ MongoDB    │ │ Redis      │            │    │
    │  │  └────────────┘ └────────────┘ └────────────┘            │    │
    │  │  ┌────────────┐ ┌────────────┐                            │    │
    │  │  │ Neo4j      │ │ Vector DB  │                            │    │
    │  │  │ (Graph)    │ │ (Qdrant)   │                            │    │
    │  │  └────────────┘ └────────────┘                            │    │
    │  └─────────────────────────────────────────────────────────┘    │
    │  ┌─────────────────────────────────────────────────────────┐    │
    │  │              EXTERNAL INTEGRATIONS                       │    │
    │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
    │  │  │WhatsApp  │ │ Google   │ │ Outlook  │ │ OpenAI   │   │    │
    │  │  │Cloud API │ │ Calendar │ │ Calendar │ │ Whisper  │   │    │
    │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
    │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │    │
    │  │  │ElevenLabs│ │ Stripe   │ │ AWS S3   │                │    │
    │  │  └──────────┘ └──────────┘ └──────────┘                │    │
    │  └─────────────────────────────────────────────────────────┘    │
    └──────────────────────────────────────────────────────────────────┘
```

## Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATION LAYER                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                        Workflow Orchestrator (Temporal)                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │ DailySummary│ │ ReminderPref│ │ CalendarAuto│ │ DocProactive│        │   │
│  │  │ Workflow    │ │ Workflow    │ │ Workflow    │ │ Workflow    │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                        Multi-Agent Message Bus                            │   │
│  │                              (Kafka Topics)                                │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │ agent.intent│ │ agent.task  │ │ agent.result│ │ agent.notify│        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   AGENT ROUTER    │    │   AGENT ROUTER    │    │   AGENT ROUTER    │
│   (Intent Class.) │    │   (Intent Class.) │    │   (Intent Class.) │
└─────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   REMINDER AGENT  │    │   CALENDAR AGENT  │    │   DOCUMENT AGENT  │
│ ┌───────────────┐ │    │ ┌───────────────┐ │    │ ┌───────────────┐ │
│ │ Tool: Create  │ │    │ │ Tool: GCal    │ │    │ │ Tool: Upload  │ │
│ │ Tool: Update  │ │    │ │ Tool: Outlook │ │    │ │ Tool: Search  │ │
│ │ Tool: Delete  │ │    │ │ Tool: Conflict│ │    │ │ Tool: Summarize│
│ │ Tool: Share   │ │    │ │ Tool: Sync    │ │    │ │ Tool: Query   │ │
│ └───────────────┘ │    │ └───────────────┘ │    │ └───────────────┘ │
└───────────────────┘    └───────────────────┘    └───────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           SHARED AI SERVICES                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  RAG Pipeline   │  │  Vector Store   │  │  Graph Store    │              │
│  │  (LlamaIndex)   │  │  (Qdrant)       │  │  (Neo4j)        │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │  LLM Service    │  │  Embedding Svc  │                                   │
│  │  (GPT-4)       │  │  (OpenAI)        │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
└───────────────────────────────────────────────────────────────────────────────┘
```

## RAG Architecture (Graph + Vector)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          RAG QUERY PIPELINE                                     │
│                                                                                  │
│    User Query ──► Intent Detection ──► [Document | Conversation] Agent          │
│                                                │                                │
│                                                ▼                                │
│    ┌─────────────────────────────────────────────────────────────────────┐     │
│    │                      RAG PIPELINE (LlamaIndex)                       │     │
│    │                                                                       │     │
│    │   ┌──────────────────┐         ┌──────────────────┐                 │     │
│    │   │  Vector Search   │         │   Graph Query    │                 │     │
│    │   │  (Qdrant)        │         │   (Neo4j)        │                 │     │
│    │   │                   │         │                   │                 │     │
│    │   │  • Semantic match │         │  • Entity links   │                 │     │
│    │   │  • Top-K chunks   │         │  • Document tree  │                 │     │
│    │   │  • Score filter   │         │  • User context   │                 │     │
│    │   └────────┬─────────┘         └────────┬─────────┘                 │     │
│    │            │                             │                           │     │
│    │            └──────────┬──────────────────┘                           │     │
│    │                       ▼                                              │     │
│    │            ┌──────────────────────┐                                  │     │
│    │            │   Context Fusion    │                                  │     │
│    │            │   • Merge results   │                                  │     │
│    │            │   • Deduplicate      │                                  │     │
│    │            │   • Rank by relev.  │                                  │     │
│    │            └──────────┬───────────┘                                  │     │
│    │                       ▼                                              │     │
│    │            ┌──────────────────────┐                                  │     │
│    │            │   LLM Generation    │                                  │     │
│    │            │   (GPT-4 Turbo)     │                                  │     │
│    │            └──────────┬───────────┘                                  │     │
│    │                       ▼                                              │     │
│    │            ┌──────────────────────┐                                  │     │
│    │            │   Response + Source │                                  │     │
│    │            │   Citations         │                                  │     │
│    │            └──────────────────────┘                                  │     │
│    └──────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### PostgreSQL (Relational Data)

```sql
-- Users & Auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    plan VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organization_members (
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
    PRIMARY KEY (org_id, user_id)
);

-- Agents
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- reminder, calendar, document, conversation
    config JSONB DEFAULT '{}',
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    timezone VARCHAR(50),
    repeat_type VARCHAR(20), -- none, daily, weekly, monthly, yearly
    repeat_interval INT DEFAULT 1,
    repeat_end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    source VARCHAR(50), -- whatsapp, dashboard, calendar
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shared_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID REFERENCES reminders(id),
    shared_with_user_id UUID REFERENCES users(id),
    permission VARCHAR(20) DEFAULT 'view', -- view, edit
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    org_id UUID REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    version INT DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'processing', -- processing, indexed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    chunk_index INT,
    chunk_text TEXT NOT NULL,
    token_count INT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Calendar
CREATE TABLE calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider VARCHAR(20) NOT NULL, -- google, outlook
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    scope TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    provider VARCHAR(20) NOT NULL,
    external_id VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    timezone VARCHAR(50),
    location VARCHAR(500),
    attendees JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    metric_type VARCHAR(50) NOT NULL,
    count INT DEFAULT 0,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### MongoDB (Messages & Sessions)

```javascript
// messages collection
{
    _id: ObjectId,
    conversation_id: "uuid",
    user_id: "uuid",
    agent_id: "uuid",
    direction: "inbound" | "outbound",
    channel: "whatsapp" | "dashboard" | "voice",
    message_type: "text" | "voice" | "document" | "image",
    content: {
        text: "message text",
        media_url: "url if media",
        media_type: "audio/ogg",
        transcription: "if voice message"
    },
    metadata: {
        whatsapp_message_id: "wamid.xxx",
        typing_indicator: boolean,
        read: boolean
    },
    context: {
        session_id: "uuid",
        turn_count: 1,
        parent_message_id: "uuid"
    },
    embeddings: [0.1, 0.2, ...], // for semantic search
    created_at: ISODate
}

// sessions collection
{
    _id: ObjectId,
    session_id: "uuid",
    user_id: "uuid",
    agent_id: "uuid",
    channel: "whatsapp",
    state: {
        current_node: "root",
        variables: {},
        memory: {}
    },
    context: {
        last_intent: "create_reminder",
        entities: {},
        slots_filled: []
    },
    preferences: {
        language: "en",
        tone: "friendly"
    },
    created_at: ISODate,
    updated_at: ISODate,
    expires_at: ISODate
}
```

### Neo4j Graph Schema

```cypher
// Nodes
(:User {id, name, email, preferences})
(:Agent {id, name, type, config})
(:Document {id, title, type, created_at})
(:Project {id, name, description})
(:Entity {id, name, type, properties})
(:Reminder {id, title, scheduled_at, status})
(:Event {id, title, start_time, end_time})
(:Topic {id, name, category})

// Relationships
(u:User)-[:OWNS]->(d:Document)
(u:User)-[:MEMBER_OF]->(p:Project)
(u:User)-[:CREATED]->(r:Reminder)
(d:Document)-[:BELONGS_TO]->(p:Project)
(d:Document)-[:HAS_TOPIC]->(t:Topic)
(t:Topic)-[:RELATED_TO]->(t:Topic)
(e:Entity)-[:LINKED_TO]->(d:Document)
(e:Entity)-[:MENTIONED_IN]->(r:Reminder)
(a:Agent)-[:HANDLES]->(d:Document)
(a:Agent)-[:ASSISTS]->(u:User)
```

### Vector DB (Qdrant) Schema

```json
{
    "collections": {
        "document_chunks": {
            "vectors": {
                "size": 1536,
                "distance": "Cosine"
            },
            "payload": {
                "document_id": "uuid",
                "user_id": "uuid",
                "org_id": "uuid",
                "chunk_text": "text content",
                "chunk_index": 0,
                "token_count": 150,
                "metadata": {
                    "source": "pdf",
                    "page": 1,
                    "topics": ["topic1", "topic2"]
                }
            }
        },
        "user_messages": {
            "vectors": {
                "size": 1536,
                "distance": "Cosine"
            },
            "payload": {
                "user_id": "uuid",
                "conversation_id": "uuid",
                "message_text": "text",
                "intent": "create_reminder",
                "created_at": "timestamp"
            }
        }
    }
}
```

## API Specifications

### REST Endpoints

```
Auth Service:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me

User Service:
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
GET    /api/users/preferences
PUT    /api/users/preferences
POST   /api/users/avatar

Agent Service:
GET    /api/agents
POST   /api/agents
GET    /api/agents/:id
PUT    /api/agents/:id
DELETE /api/agents/:id
POST   /api/agents/:id/test

Reminder Service:
GET    /api/reminders
POST   /api/reminders
GET    /api/reminders/:id
PUT    /api/reminders/:id
DELETE /api/reminders/:id
POST   /api/reminders/:id/complete
POST   /api/reminders/:id/share
GET    /api/reminders/shared-with-me

Calendar Service:
GET    /api/calendar/connect/google
GET    /api/calendar/connect/outlook
GET    /api/calendar/callback/google
GET    /api/calendar/callback/outlook
GET    /api/calendar/events
POST   /api/calendar/events
PUT    /api/calendar/events/:id
DELETE /api/calendar/events/:id
POST   /api/calendar/sync
GET    /api/calendar/conflicts

Document Service:
GET    /api/documents
POST   /api/documents/upload
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/:id/download
POST   /api/documents/:id/process
GET    /api/documents/:id/status

RAG Service:
POST   /api/rag/query
GET    /api/rag/search
POST   /api/rag/summarize/:documentId
GET    /api/rag/chat/history

Billing Service:
GET    /api/billing/plans
POST   /api/billing/subscribe
GET    /api/billing/subscription
POST   /api/billing/cancel
GET    /api/billing/invoices
POST   /api/billing/portal

Webhooks:
POST   /api/webhooks/whatsapp
POST   /api/webhooks/stripe
```

### GraphQL Schema

```graphql
type Query {
    me: User
    agents: [Agent!]!
    agent(id: ID!): Agent
    reminders(filter: ReminderFilter): [Reminder!]!
    reminder(id: ID!): Reminder
    documents(filter: DocumentFilter): [Document!]!
    document(id: ID!): Document
    search(query: String!, limit: Int): SearchResults!
    conversation(userId: ID!): Conversation
}

type Mutation {
    createAgent(input: CreateAgentInput!): Agent!
    updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
    deleteAgent(id: ID!): Boolean!
    
    createReminder(input: CreateReminderInput!): Reminder!
    updateReminder(id: ID!, input: UpdateReminderInput!): Reminder!
    
    uploadDocument(file: Upload!): Document!
    queryDocument(id: ID!, question: String!): DocumentResponse!
    
    sendMessage(input: SendMessageInput!): Message!
}

type Subscription {
    messageReceived(userId: ID!): Message!
    agentTyping(userId: ID!): TypingIndicator!
    reminderTriggered(userId: ID!): Reminder!
}
```

## API Documentation

### OpenAPI/Swagger

The API is fully documented using the OpenAPI 3.0 specification.

**Documentation URLs:**
- Swagger UI: `http://localhost:3000/api/docs/`
- OpenAPI JSON: `http://localhost:3000/api/docs/swagger.json`
- Postman Collection: `http://localhost:3000/api/docs/postman`

**SDK Clients:**

A TypeScript SDK is available for easy integration:

```typescript
import { createClient } from '@whatsapp-ai/sdk';

const client = createClient('https://api.whatsappagent.io');

// Authenticate
const { token } = await client.auth.login({
  email: 'user@example.com',
  password: 'password123'
});
client.setToken(token);

// Create a reminder
const reminder = await client.reminders.create({
  title: 'Team meeting',
  scheduledAt: '2024-12-20T10:00:00Z',
  timezone: 'America/New_York',
  repeatType: 'weekly'
});

// Query the knowledge base
const result = await client.rag.query({
  query: 'What are the product features?',
  topK: 5
});
```

**TypeScript SDK Features:**
- Full type safety
- Automatic token management
- Built-in error handling
- Support for all API endpoints

**Authentication:**
```bash
# Get your token from login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use token in requests
curl http://localhost:3000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Monitoring & Observability

### Metrics Collection (Prometheus)

Metrics are collected using the `@whatsapp-ai/monitoring` package with Prometheus client.

**Available Metrics:**
- `whatsappai_http_requests_total` - HTTP request counter
- `whatsappai_http_request_duration_seconds` - Request latency histogram
- `whatsappai_agent_requests_total` - Agent request counter
- `whatsappai_agent_response_duration_seconds` - Agent latency histogram
- `whatsappai_rag_queries_total` - RAG query counter
- `whatsappai_whatsapp_messages_*` - WhatsApp message counters
- `whatsappai_reminder_triggers_total` - Reminder trigger counter
- `whatsappai_errors_total` - Error counter
- `whatsappai_cache_hits_total` / `whatsappai_cache_misses_total` - Cache metrics

**Usage:**
```typescript
import { initMetrics, getMetrics } from '@whatsapp-ai/monitoring';

const metrics = initMetrics({
  serviceName: 'api-gateway',
  collectDefaultMetrics: true,
});

// Record custom metrics
metrics.recordHttpRequest('GET', '/api/agents', 200, 45);
metrics.recordAgentRequest('reminder', 'success');
metrics.recordRagQuery('success');

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.getContentType());
  res.send(await metrics.getMetrics());
});
```

### Logging (Loki)

Structured logging with Winston and Loki integration.

**Usage:**
```typescript
import { initLogger, getLogger } from '@whatsapp-ai/monitoring';

const logger = initLogger({
  serviceName: 'api-gateway',
  environment: 'production',
  lokiUrl: 'http://loki:3100',
  lokiEnabled: true,
});

// Log with context
logger.info('Processing request', {
  userId: 'user-123',
  requestId: 'req-456',
});

logger.error('Database error', error, {
  table: 'users',
  operation: 'SELECT',
});
```

### Distributed Tracing (OpenTelemetry/Tempo)

Distributed tracing with automatic instrumentation.

**Usage:**
```typescript
import { initTracing, getTracing } from '@whatsapp-ai/monitoring';

const tracing = await initTracing({
  serviceName: 'api-gateway',
  serviceVersion: '1.0.0',
  environment: 'production',
  otlpEndpoint: 'http://tempo:4318',
});

// Wrap async operations
const result = await tracing.withSpan('process-message', async (span) => {
  span.setAttribute('message_id', messageId);
  return processMessage(messageId);
});
```

### Dashboards & Alerting

**Grafana Dashboards:**
- Overview Dashboard: Request rates, latency, error rates
- Agent Metrics: Per-agent performance
- WhatsApp Metrics: Message delivery tracking
- Infrastructure: CPU, memory, disk usage

**Alert Rules:**
- High HTTP error rate (>5%)
- High API latency (p95 > 2s)
- Agent failure rate (>10%)
- Service down
- High resource usage
- Database/Redis/Kafka availability

**Access:**
```bash
# Prometheus
http://localhost:9090

# Grafana
http://localhost:3001 (admin/admin)

# Loki Logs
http://localhost:3100

# Tempo Traces
http://localhost:3100
```

### Health Checks

Built-in health check endpoints:

```typescript
import { HealthCheckService, checkDatabaseHealth, checkRedisHealth } from '@whatsapp-ai/monitoring';

const healthService = new HealthCheckService('1.0.0');
healthService.register('database', () => checkDatabaseHealth(prisma));
healthService.register('redis', () => checkRedisHealth(redis));

app.get('/health', createHealthCheckRouter(healthService));
app.get('/ready', createReadinessRouter(healthService));
app.get('/live', createLivenessRouter());
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": [
    { "name": "database", "status": "healthy", "latencyMs": 5 },
    { "name": "redis", "status": "healthy", "latencyMs": 2 }
  ]
}
```

