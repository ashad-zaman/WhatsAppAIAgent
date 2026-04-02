# WhatsApp AI Platform - Documentation

A production-grade **microservices** SaaS platform for building AI-powered WhatsApp assistants with multi-agent orchestration, Graph RAG, and autonomous workflow management.

---

## Overview

| Stats         | Value             |
| ------------- | ----------------- |
| Microservices | 15+               |
| Databases     | 6                 |
| Test Suite    | 372 tests passing |

### Architecture

This platform follows a **microservices architecture** with event-driven communication using Apache Kafka for inter-service messaging.

### Key Features

- **Microservices Architecture** - 15+ independent services communicating via Kafka with API Gateway routing
- **Multi-Agent Orchestration** - Intelligent routing with LangGraph for specialized AI agents that collaborate on complex tasks
- **Graph RAG** - Combine vector embeddings with knowledge graphs for more accurate, contextual AI responses
- **Temporal Workflows** - Autonomous task orchestration with Temporal.io for reliable, long-running workflows
- **Enterprise Security** - End-to-end encryption, RBAC, audit logging, and GDPR compliance built-in

### Technology Stack

`Node.js 20` `TypeScript` `Express.js` `Next.js 14` `LangChain/LangGraph` `LlamaIndex` `Prisma` `PostgreSQL` `MongoDB` `Redis` `Neo4j` `Qdrant` `Kafka` `Temporal` `Kubernetes` `Prometheus` `Grafana` `Sentry`

---

## WhatsApp User Experience

Users interact with the AI assistant directly through WhatsApp:

### Features

| Feature                       | Description                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| **Natural Language Commands** | Send messages like "Remind me to call mom at 5pm" or "Schedule meeting tomorrow at 2pm"      |
| **Proactive Reminders**       | AI sends WhatsApp notifications - supports one-time, daily, weekly, monthly recurring        |
| **Calendar Integration**      | Say "Schedule team meeting Friday at 3pm" - syncs with Google Calendar and Outlook           |
| **Document Q&A**              | Upload documents via dashboard, ask questions in WhatsApp like "What does the contract say?" |
| **Smart Suggestions**         | AI analyzes patterns and suggests reminders proactively                                      |
| **Shared Reminders**          | Share reminders with family or team members                                                  |

### Example Conversations

```
# User sends message via WhatsApp
User: "Remind me to water the plants every day at 9am"

# AI confirms and creates recurring reminder
AI: ✅ Done! I've set a daily reminder to water the plants at 9:00 AM.
    You'll receive a WhatsApp notification every morning.

---

User: "Schedule a meeting with the team tomorrow at 3pm"

# AI creates calendar event
AI: 📅 I've scheduled "Team Meeting" for tomorrow (March 15) at 3:00 PM.
    I've also added it to your Google Calendar.

---

User: "What's in the Q4 report about revenue?"

# AI queries uploaded documents
AI: Based on the Q4 report, revenue increased by 23% compared to Q3.
    Key points:
    • Total revenue: $2.4M
    • Growth: 23% YoY
    • Strongest performance: Enterprise segment

---

User: "What are my reminders for today?"

# AI lists upcoming reminders
AI: 📋 Your reminders for today:
    1. Morning standup - 9:00 AM
    2. Call mom - 5:00 PM
    3. Pay bills - 7:00 PM
```

### Supported Message Types

| Type         | Description               | Response                          |
| ------------ | ------------------------- | --------------------------------- |
| **Text**     | Natural language commands | AI response + action confirmation |
| **Image**    | Photo uploads             | Upload to dashboard for analysis  |
| **Voice**    | Voice messages (Pro plan) | Whisper transcription + action    |
| **Document** | PDF, DOCX files           | Upload to dashboard for indexing  |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│   │   WhatsApp   │    │ Web Dashboard│    │  Mobile App  │        │
│   │  Cloud API   │    │   (Next.js)  │    │(React Native) │        │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘        │
└───────────┼───────────────────┼───────────────────┼─────────────────┘
            │                   │                   │
            └───────────────────┴─────────┬─────────┴───────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Rate Limiting │ JWT Auth │ Load Balancing │ WebSocket │ SSL ││
│  └─────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────┬─────────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│      MESSAGE BUS          │ │      MESSAGE BUS          │ │      MESSAGE BUS          │
│    (Kafka Topics)         │ │    (Kafka Topics)         │ │    (Kafka Topics)         │
│  ┌───────────────────┐   │ │  ┌───────────────────┐   │ │  ┌───────────────────┐   │
│  │ agent.intent      │   │ │  │ agent.task        │   │ │  │ agent.result      │   │
│  │ agent.routing     │   │ │  │ agent.execution   │   │ │  │ agent.notification│   │
│  └───────────────────┘   │ │  └───────────────────┘   │ │  └───────────────────┘   │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
                    │                       │                       │
    ┌───────────────┼───────────────┬───────┴───────────────┬───────┴───────────────┐
    │               │               │                       │                       │
    ▼               ▼               ▼                       ▼                       ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Auth   │   │  User   │   │  Agent  │   │   RAG    │   │Messaging│   │Workflow │
│ Service │   │ Service │   │ Service │   │ Service  │   │ Service │   │Service  │
└─────────┘   └─────────┘   └────┬────┘   └────┬────┘   └─────────┘   └────┬────┘
                                  │               │                           │
                    ┌─────────────┴───────────────┴─────────────┐           │
                    ▼                                               ▼           │
        ┌───────────────────────┐                   ┌───────────────────────────┐│
        │   MULTI-AGENT LAYER   │                   │      KNOWLEDGE LAYER      ││
        │  ┌─────┐ ┌─────┐     │                   │  ┌─────────┐ ┌─────────┐ ││
        │  │Chat │ │Rmrndr│     │                   │  │ Qdrant  │ │  Neo4j  │ ││
        │  │Agent│ │Agent │     │                   │  │(Vector) │ │ (Graph) │ ││
        │  └─────┘ └─────┘     │                   │  └─────────┘ └─────────┘ ││
        │  ┌─────┐ ┌─────┐     │                   └───────────────────────────┘│
        │  │Cldr │ │Doc  │     │                                                   │
        │  │Agent│ │Agent│     │                                                   │
        │  └─────┘ └─────┘     │                                                   │
        └───────────────────────┘                                                   │

┌───────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │PostgreSQL│ │ MongoDB │ │  Redis  │ │Temporal │ │  Kafka  │ │ Sentry  │        │
│  │(Primary) │ │(Messages)│ │(Cache) │ │(Workflow)│ │(Events) │ │(Errors) │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Agent Collaboration

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATION LAYER (LangGraph)                            │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                        Supervisor Agent                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        Message Intent Classification                       │  │  │
│  │  │   "Schedule a meeting with John tomorrow at 3pm"                         │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                    │                                            │  │
│  │                    ┌───────────────┼───────────────┐                            │  │
│  │                    │               │               │                            │  │
│  │                    ▼               ▼               ▼                            │  │
│  │              ┌──────────┐   ┌──────────┐   ┌──────────┐                      │  │
│  │              │ Calendar │   │ Reminder │   │   Chat   │                      │  │
│  │              │  Agent   │   │  Agent   │   │  Agent   │                      │  │
│  │              │ • Parse  │   │ • Create │   │ • Generate│                      │  │
│  │              │ • Check  │   │ • Notify │   │ • Context │                      │  │
│  │              │ • Reserve│   │ • Followup│  │ • Response│                      │  │
│  │              └────┬─────┘   └────┬─────┘   └────┬─────┘                      │  │
│  │                   │             │             │                               │  │
│  │                   └─────────────┼─────────────┘                               │  │
│  │                                 ▼                                              │  │
│  │                    ┌────────────────────────┐                                  │  │
│  │                    │    Response Synthesizer │                                  │  │
│  │                    │  "I've scheduled your   │                                  │  │
│  │                    │   meeting with John...  │                                  │  │
│  │                    └────────────────────────┘                                  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                              │
│                                       ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                           External Integrations                                 │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │
│  │   │ Google   │  │ Outlook  │  │ OpenAI   │  │ Stripe   │  │ WhatsApp │        │  │
│  │   │ Calendar │  │ Calendar │  │ GPT-4    │  │ Payments │  │ Cloud API│        │  │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Services

| Service               | Description                                                                       | Technology   |
| --------------------- | --------------------------------------------------------------------------------- | ------------ |
| **API Gateway**       | Main entry point handling authentication, rate limiting, and request routing      | Express.js   |
| **Agent Service**     | Multi-agent orchestration with LangGraph for intelligent message handling         | LangGraph    |
| **RAG Service**       | Graph RAG combining vector search with knowledge graphs for accurate AI responses | LlamaIndex   |
| **Messaging Service** | WhatsApp Cloud API integration for sending and receiving messages                 | WhatsApp API |
| **Workflow Service**  | Temporal.io orchestration for reliable, long-running autonomous workflows         | Temporal     |
| **Dashboard**         | Next.js admin dashboard for managing agents, conversations, and analytics         | Next.js 14   |

---

## Multi-Agent System

### Agent Types

| Agent              | Responsibilities                     | Tools                   |
| ------------------ | ------------------------------------ | ----------------------- |
| **Router Agent**   | Intent classification, task routing  | GPT-4, Embeddings       |
| **Chat Agent**     | Conversational AI, Q&A               | GPT-4, RAG              |
| **Reminder Agent** | Schedule reminders, follow-ups       | Temporal, Notifications |
| **Calendar Agent** | Schedule management, meeting booking | Google/Outlook API      |
| **Document Agent** | Document processing, summarization   | RAG, GPT-4              |
| **Voice Agent**    | Audio transcription, synthesis       | Whisper, ElevenLabs     |

### Graph RAG Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              GRAPH RAG PIPELINE                                      │
│                                                                                     │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   Document  │────▶│  Text       │────▶│  Embedding  │────▶│   Vector    │      │
│   │   Ingestion │     │  Chunker    │     │  Generator  │     │   Store     │      │
│   └─────────────┘     └─────────────┘     └─────────────┘     │  (Qdrant)   │      │
│                                                               └───────┬─────┘      │
│                                                                           │          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │          │
│   │   Entity   │────▶│  Relation   │────▶│   Graph     │◀─────────────┘          │
│   │  Extractor │     │   Builder   │     │   Store     │                         │
│   └─────────────┘     └─────────────┘     │  (Neo4j)    │                         │
│                                           └──────┬──────┘                         │
│                                                  │                                 │
│                                                  ▼                                 │
│   ┌───────────────────────────────────────────────────────────────────────────┐   │
│   │                         QUERY ORCHESTRATION                               │   │
│   │                                                                           │   │
│   │    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │   │
│   │    │  Query   │───▶│ Vector   │───▶│  Graph   │───▶│  Result  │          │   │
│   │    │  Router  │    │  Search  │    │   Traverse│   │  Synth.  │          │   │
│   │    └──────────┘    └──────────┘    └──────────┘    └──────────┘          │   │
│   │          │                                                        │          │   │
│   │          │         ┌────────────────────────────────────┐        │          │   │
│   │          └────────▶│          LLM Synthesizer           │◀───────┘          │   │
│   │                    │  Combines vector + graph results   │                   │   │
│   │                    │  for accurate, contextual answers  │                   │   │
│   │                    └────────────────────────────────────┘                   │   │
│   └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture

| Database       | Type     | Purpose                                             |
| -------------- | -------- | --------------------------------------------------- |
| **PostgreSQL** | Primary  | User data, subscriptions, audit logs, configuration |
| **MongoDB**    | Messages | Messages, conversations, sessions                   |
| **Redis**      | Cache    | Caching, rate limiting, sessions                    |
| **Qdrant**     | Vector   | Vector embeddings for RAG                           |
| **Neo4j**      | Graph    | Knowledge graphs, relationships                     |
| **Kafka**      | Events   | Event streaming, async messaging                    |

---

## Security & Compliance

### Security Features

- **Encryption** - AES-256 at rest, TLS 1.3 in transit
- **RBAC** - Role-based access control with granular permissions
- **Audit Logging** - Comprehensive audit trail for all operations
- **Rate Limiting** - API protection against abuse and DDoS

### GDPR Compliance

- Data subject rights (access, rectification, erasure)
- Consent management with granular controls
- Data portability in JSON format
- Right to be forgotten implementation
- Data retention policies (90 days messages, 7 years audit logs)
- Cookie consent banner with preferences
- Privacy policy and terms of service
- Standard Contractual Clauses for international transfers

### Data Retention

| Data Type    | Retention      | Method              |
| ------------ | -------------- | ------------------- |
| User Profile | Until deletion | Permanent delete    |
| Messages     | 90 days        | Scheduled purge     |
| AI Context   | 30 days        | Scheduled purge     |
| Audit Logs   | 7 years        | Archive then delete |
| Analytics    | 12 months      | Anonymization       |

---

## API Reference

### Authentication Endpoints

| Endpoint           | Method | Description                               |
| ------------------ | ------ | ----------------------------------------- |
| `/api/auth/signup` | POST   | Register new user with email verification |
| `/api/auth/login`  | POST   | Authenticate user and return JWT token    |
| `/api/otp/send`    | POST   | Send OTP for verification                 |
| `/api/otp/verify`  | POST   | Verify OTP code                           |

### User Management API

| Endpoint                | Method          | Description                      |
| ----------------------- | --------------- | -------------------------------- |
| `/api/user/profile`     | GET/PUT         | Get or update user profile       |
| `/api/user/preferences` | GET/PUT         | Manage user preferences          |
| `/api/user/password`    | PUT             | Change user password             |
| `/api/user/2fa`         | GET/POST/DELETE | Manage two-factor authentication |
| `/api/user/export`      | POST            | Export user data (GDPR)          |

### Reminders API

| Endpoint              | Method         | Description                |
| --------------------- | -------------- | -------------------------- |
| `/api/reminders`      | GET/POST       | List or create reminders   |
| `/api/reminders/[id]` | GET/PUT/DELETE | Manage individual reminder |

### Calendar API

| Endpoint                | Method         | Description                     |
| ----------------------- | -------------- | ------------------------------- |
| `/api/events`           | GET/POST       | List or create calendar events  |
| `/api/events/[id]`      | GET/PUT/DELETE | Manage individual event         |
| `/api/calendar/connect` | POST           | Connect Google/Outlook calendar |
| `/api/calendar/sync`    | POST           | Sync calendar events            |

### Documents API

| Endpoint                       | Method     | Description                        |
| ------------------------------ | ---------- | ---------------------------------- |
| `/api/documents`               | GET/POST   | List or upload documents           |
| `/api/documents/[id]`          | GET/DELETE | Get or delete document             |
| `/api/documents/upload`        | POST       | Upload document for RAG processing |
| `/api/documents/query`         | POST       | Query documents using AI (RAG)     |
| `/api/documents/[id]/download` | GET        | Download document file             |

### Workflows API

| Endpoint                      | Method         | Description                |
| ----------------------------- | -------------- | -------------------------- |
| `/api/workflows`              | GET/POST       | List or create workflows   |
| `/api/workflows/[id]`         | GET/PUT/DELETE | Manage individual workflow |
| `/api/workflows/[id]/execute` | POST           | Execute workflow manually  |

### Billing API

| Endpoint                       | Method | Description                    |
| ------------------------------ | ------ | ------------------------------ |
| `/api/billing`                 | GET    | Get current subscription       |
| `/api/checkout/create-session` | POST   | Create Stripe checkout session |
| `/api/webhooks/stripe`         | POST   | Handle Stripe webhook events   |

### Admin API

| Endpoint                 | Method         | Description                      |
| ------------------------ | -------------- | -------------------------------- |
| `/api/admin/users`       | GET/POST       | List or create users (admin)     |
| `/api/admin/users/[id]`  | GET/PUT/DELETE | Manage user (admin)              |
| `/api/admin/agents`      | GET/POST       | List or create AI agents (admin) |
| `/api/admin/agents/[id]` | GET/PUT/DELETE | Manage AI agent (admin)          |
| `/api/admin/settings`    | GET/PUT        | Platform settings (admin)        |

### WhatsApp Webhooks API

| Endpoint                 | Method   | Description                        |
| ------------------------ | -------- | ---------------------------------- |
| `/api/webhooks/whatsapp` | GET/POST | WhatsApp Cloud API webhook handler |

### Error Responses

```json
// 400 Bad Request
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "details": { "email": "must be a valid email" }
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}

// 403 Forbidden
{
  "error": "Forbidden",
  "message": "Upgrade to Pro plan to access this feature"
}

// 404 Not Found
{
  "error": "NotFound",
  "message": "Resource not found"
}

// 429 Too Many Requests
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded. Try again later.",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "error": "InternalError",
  "message": "An unexpected error occurred"
}
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop
- kubectl 1.28+

### Installation

```bash
# Clone the repository
git clone https://github.com/whatsapp-ai/platform.git
cd platform

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start infrastructure services
docker-compose up -d postgres mongodb redis kafka zookeeper qdrant neo4j temporal

# Start development servers
pnpm dev
```

### Environment Variables

```bash
# Core
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsapp_ai
MONGODB_URL=mongodb://localhost:27017/whatsapp_ai
REDIS_URL=redis://localhost:6379

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# AI
OPENAI_API_KEY=sk-your-api-key

# JWT
JWT_SECRET=your-secret-key-min-256-bits
```

---

## Frontend & Dashboard

### Frontend Architecture

| Technology   | Purpose                         |
| ------------ | ------------------------------- |
| Next.js 14   | React framework with App Router |
| TypeScript   | Type-safe frontend development  |
| Tailwind CSS | Utility-first styling           |
| Radix UI     | Accessible UI primitives        |
| NextAuth.js  | Authentication                  |
| Recharts     | Data visualization              |
| Lucide React | Icon library                    |

### Dashboard Structure

```
apps/dashboard/src/
├── app/
│   ├── layout.tsx           Root layout with providers
│   ├── page.tsx             Landing page
│   ├── providers.tsx        React providers
│   └── globals.css          Global styles
├── components/
│   ├── ui/                  Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── cookie-consent/       GDPR cookie banner
├── hooks/                   Custom React hooks
│   └── useCookieConsent.ts
└── lib/                     Utilities
    └── utils.ts
```

### Pricing Plans

| Plan           | Price  | Key Features                                                                |
| -------------- | ------ | --------------------------------------------------------------------------- |
| **Free**       | $0/mo  | 5 reminders/day, 1 agent, 100 messages/month                                |
| **Pro**        | $29/mo | Unlimited reminders, 5 agents, 5000 messages, Calendar sync, Document RAG   |
| **Enterprise** | $99/mo | Unlimited everything, Custom integrations, Dedicated support, SLA guarantee |

---

## Monitoring & Observability

### Monitoring Stack

| Tool           | Purpose                                     |
| -------------- | ------------------------------------------- |
| **Prometheus** | Metrics collection with 100+ custom metrics |
| **Grafana**    | Dashboards for system health and KPIs       |
| **Loki**       | Log aggregation with label-based filtering  |
| **Tempo**      | Distributed tracing with OpenTelemetry      |

### Key Dashboards

- **System Overview** - Cluster health, node metrics, pod status
- **Service Metrics** - Request rate, latency, error rates per service
- **Agent Performance** - LangGraph execution times, token usage
- **RAG Quality** - Search relevance, retrieval accuracy
- **Business KPIs** - Active users, message volume, AI response times
- **Database Performance** - Query latency, connection pools, cache hit rates

### Alerting Rules

| Alert           | Condition                     | Severity |
| --------------- | ----------------------------- | -------- |
| High Error Rate | Error rate > 5% for 5 minutes | Critical |
| Service Down    | Pod not running               | Critical |
| High Latency    | p99 > 1s for 5 minutes        | Warning  |
| Memory Pressure | Memory usage > 90%            | Warning  |
| Disk Space Low  | Disk > 85% used               | Warning  |

---

## Kubernetes Infrastructure

### Production Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION KUBERNETES CLUSTER                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    CONTROL PLANE                                 │ │
│  │   API Server │ etcd │ Controller Manager │ Scheduler           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      NODE POOLS                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │ │
│  │  │   General    │  │  AI Compute  │  │    Memory    │          │ │
│  │  │  (3 nodes)   │  │  (GPU nodes) │  │  Optimized   │          │ │
│  │  │  api-gateway │  │  agent-svc   │  │  redis       │          │ │
│  │  │  dashboard   │  │  rag-svc     │  │  mongodb     │          │ │
│  │  │  auth        │  │              │  │  postgres    │          │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      ADDONS                                       │ │
│  │  Ingress-NGINX │ Cert-Manager │ Metrics-Server │ CoreDNS        │ │
│  │  Istio Service Mesh │ Prometheus Stack │ Loki │ Tempo           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Mesh (Istio)

- mTLS in STRICT mode for all service-to-service communication
- Circuit breakers with configurable thresholds
- Rate limiting and quota management
- JWT validation for API authentication
- Automatic retries with exponential backoff
- Traffic management for canary deployments

---

## Configuration Reference

### Service Ports

| Service           | Port           | Health Endpoint |
| ----------------- | -------------- | --------------- |
| API Gateway       | 3000           | /health         |
| Agent Service     | 3001           | /health         |
| RAG Service       | 3002           | /health         |
| Messaging Service | 3003           | /health         |
| Workflow Service  | 3004           | /health         |
| Dashboard         | 3000 (Next.js) | /api/health     |

### Kafka Topics

| Topic             | Purpose                        | Partitions |
| ----------------- | ------------------------------ | ---------- |
| agent.intent      | Intent classification requests | 12         |
| agent.task        | Agent task execution           | 12         |
| agent.result      | Agent execution results        | 12         |
| agent.notify      | Agent notifications            | 6          |
| messages.inbound  | Incoming WhatsApp messages     | 12         |
| messages.outbound | Outgoing WhatsApp messages     | 12         |

---

## Development Scripts

| Script                              | Description                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `./scripts/setup.sh`                | Comprehensive setup - checks prerequisites, installs deps, generates Prisma client |
| `./scripts/dev.sh`                  | Starts all services in development mode using Turbo                                |
| `./scripts/deploy.sh [environment]` | Deploy to dev/staging/production                                                   |
| `./scripts/health-check.sh`         | Checks health status of all services                                               |
| `./scripts/migrate.sh [command]`    | Database migration management (status, up, down, deploy, create)                   |

---

## Testing

### Test Statistics

| Metric          | Value |
| --------------- | ----- |
| Tests Passing   | 372   |
| Test Suites     | 15    |
| Packages Tested | 15    |

### Test Categories

- **Packages**: config, common, events, queue, sentry, whatsapp, cdn, gdpr
- **Services**: api-gateway, agent, messaging, rag, workflow
- **Frontend**: Components, utilities, hooks

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm jest tests/unit --coverage

# Run specific test file
pnpm jest tests/unit/packages/queue.test.ts
```

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-4) ✅

- Project structure and monorepo setup
- Core packages (common, config, database, queue, events, ai, whatsapp)
- API Gateway with authentication
- PostgreSQL + MongoDB + Redis connections
- Basic CI/CD pipeline

### Phase 2: Core Services (Weeks 5-8) ✅

- Multi-agent orchestration system with LangGraph
- WhatsApp Cloud API integration
- Webhook processor for incoming messages
- Message processing pipeline
- Basic reminder functionality

### Phase 3: AI Features (Weeks 9-12) ✅

- RAG pipeline with LlamaIndex
- Vector database integration (Qdrant)
- Graph database integration (Neo4j)
- Document indexing and search
- Voice message processing (Whisper)

### Phase 4: Advanced Features (Weeks 13-16) ✅

- Calendar sync (Google + Outlook)
- Temporal workflow orchestration
- Autonomous AI workflows
- Document intelligence (summarization, Q&A)
- Multi-agent collaboration

### Phase 5: Frontend & UX (Weeks 17-20) ✅

- Next.js dashboard application
- User authentication flows
- Reminder management UI
- Document management UI
- Conversation history

### Phase 6: Production Readiness (Weeks 21-24) ✅

- Kubernetes deployment manifests
- Monitoring and observability (Prometheus/Grafana)
- Error tracking (Sentry)
- Load testing and optimization
- Security audit
- Production Kubernetes deployment
- GDPR compliance
- Documentation

---

## Legal Pages

### Privacy Policy

**Route:** `/privacy`

Comprehensive privacy policy covering:

- Information collection (name, email, phone, usage data)
- Data usage and processing purposes
- Data sharing with third parties
- Data retention policies
- User rights under GDPR
- Children's privacy (13+ requirement)
- International data transfers
- Contact information for privacy inquiries

### Terms of Service

**Route:** `/terms`

Terms of service covering:

- Acceptance of terms
- Account registration requirements
- Acceptable use policy
- User content and ownership
- Intellectual property rights
- Service availability and modifications
- Limitation of liability
- Indemnification clause
- Governing law (California)
- Dispute resolution process

### Cookie Policy

**Route:** `/cookies`

Cookie policy detailing:

- Types of cookies used (essential, analytics, functional)
- Purpose of each cookie type
- Third-party cookie providers
- User consent requirements
- Cookie management instructions

---

## Version

**Version:** 1.0.0  
**Last updated:** March 30, 2026

- [GitHub](https://github.com/whatsapp-ai/platform)
- [Privacy Policy](/legal/privacy-policy)
- [Terms of Service](/legal/terms-of-service)
