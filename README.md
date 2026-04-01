# WhatsApp AI Agent Platform

A production-grade SaaS platform for building AI-powered WhatsApp assistants with multi-agent orchestration, Graph RAG, and autonomous workflow management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)

## 🚀 Features

- **Multi-Agent Orchestration** - LangChain/LangGraph powered AI agents that collaborate on complex tasks
- **Graph RAG** - Combine vector embeddings with knowledge graphs for accurate, contextual AI responses
- **WhatsApp Integration** - Full WhatsApp Cloud API integration for sending and receiving messages
- **Smart Reminders** - One-time & recurring reminders with plan-based access control
- **Calendar Management** - Create, manage, and sync calendar events with Google/Outlook OAuth
- **Call Reminders** - Schedule call reminders with smart notifications
- **Notes Management** - Create and manage notes with AI-powered search
- **Document Intelligence** - Upload, process, chunk, and query documents with RAG
- **Workflow Automation** - Temporal.io orchestration for reliable autonomous workflows
- **Stripe Billing** - Subscription management with Free/Pro/Enterprise plans

### Reminder Features

- **One-time Reminders** - Schedule single reminders for any date/time
- **Repeated Reminders** - Daily, weekly, monthly, or custom recurrence patterns
- **Call Reminders** - Special reminder type for phone call notifications
- **WhatsApp Notifications** - Receive reminders via WhatsApp message

### Calendar Features

- **Event Creation** - Create events with title, description, location, time
- **Google Calendar Sync** - OAuth-based two-way sync with Google Calendar
- **Outlook Calendar Sync** - OAuth-based two-way sync with Outlook
- **Conflict Detection** - Automatic detection of overlapping events
- **Event Reminders** - Get notified before scheduled events

### Document Features

- **Document Upload** - Upload PDF, DOC, XLS, images with metadata
- **Automatic Chunking** - Intelligent text chunking for RAG processing
- **Vector Embedding** - Generate embeddings for semantic search
- **AI Query** - Ask questions about your documents using AI
- **Knowledge Graph** - Link documents with Neo4j for relationship search

## 🏗️ Architecture

This platform follows a **microservices architecture** with event-driven communication:

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (Express.js)                 │
│              Rate Limiting | JWT Auth | Request Routing        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Auth Service │    │  Agent Service  │    │  RAG Service    │
│   (Express)   │    │  (LangGraph)    │    │  (LlamaIndex)   │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Billing       │    │  Workflow       │    │  Messaging     │
│ (Stripe)      │    │  (Temporal.io)  │    │  (WhatsApp API) │
└───────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Architecture Components

| Component              | Technology     | Description                                                                                 |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| **API Gateway**        | Express.js     | Central entry point with rate limiting, JWT auth, request routing                           |
| **Multi-Agent System** | LangGraph      | Orchestration for specialized AI agents (Router, Chat, Reminder, Calendar, Document, Voice) |
| **Graph RAG**          | Qdrant + Neo4j | Hybrid vector search + knowledge graph for accurate AI responses                            |
| **Workflow Engine**    | Temporal.io    | Reliable long-running autonomous processes with retry logic                                 |
| **Event Bus**          | Kafka          | Inter-service messaging and event sourcing                                                  |
| **Dashboard**          | Next.js 14     | App Router with role-based UI (Admin + User)                                                |

### AI Agent Types

| Agent              | Responsibilities                       | Tools              |
| ------------------ | -------------------------------------- | ------------------ |
| **Router Agent**   | Intent classification, task routing    | GPT-4, Embeddings  |
| **Chat Agent**     | Conversational AI, Q&A                 | GPT-4, RAG         |
| **Reminder Agent** | Create/manage reminders, notifications | Calendar, WhatsApp |
| **Calendar Agent** | Event scheduling, conflict detection   | Google/Outlook API |
| **Document Agent** | Document processing, summarization     | RAG, Embeddings    |
| **Voice Agent**    | Speech-to-text, voice commands         | Whisper API        |

## 📚 Documentation

- **[Main Documentation](docs/html/index.html)** - Comprehensive platform documentation
- **[API Documentation](docs/api/index.html)** - Interactive Swagger UI with request/response examples
- **[Architecture](ARCHITECTURE.md)** - System architecture and design patterns
- **[Development Roadmap](DEVELOPMENT_ROADMAP.md)** - Project milestones and future plans
- **[Deployment Guide](docs/DEPLOYMENT_RUNBOOK.md)** - Production deployment instructions

## 🛠️ Technology Stack

| Category       | Technologies                                   |
| -------------- | ---------------------------------------------- |
| Frontend       | Next.js 14, React, TypeScript, Tailwind CSS    |
| Backend        | Node.js, Express.js, Next.js API Routes        |
| AI/ML          | OpenAI GPT-4, LangChain, LangGraph, LlamaIndex |
| Database       | PostgreSQL (Prisma), MongoDB, Redis            |
| Vector/Graph   | Qdrant, Neo4j                                  |
| Messaging      | WhatsApp Cloud API                             |
| Billing        | Stripe                                         |
| Infrastructure | Kubernetes, Docker, Temporal.io, Kafka         |
| Monitoring     | Prometheus, Grafana, Sentry                    |

## 📋 Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL
- Redis
- OpenAI API Key

## 🏁 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
cd packages/database && npx prisma migrate dev

# Start development server
pnpm dev
```

## 📖 Key Endpoints

| Endpoint                            | Description                   |
| ----------------------------------- | ----------------------------- |
| `POST /api/auth/signup`             | User registration             |
| `POST /api/auth/login`              | User authentication           |
| `GET/POST /api/reminders`           | Manage reminders              |
| `GET/POST /api/events`              | Manage calendar events        |
| `GET/POST /api/documents`           | Manage documents              |
| `POST /api/documents/query`         | Query documents with AI (RAG) |
| `GET/POST /api/workflows`           | Manage workflows              |
| `POST /api/checkout/create-session` | Create Stripe checkout        |
| `POST /api/webhooks/whatsapp`       | WhatsApp message handler      |

## 💰 Pricing Plans

| Feature          | Free | Pro ($29/mo) | Enterprise ($99/mo) |
| ---------------- | ---- | ------------ | ------------------- |
| Daily Messages   | 100  | 10,000       | Unlimited           |
| AI Agents        | 2    | 10           | Unlimited           |
| Reminders        | 5/mo | 100/mo       | Unlimited           |
| Document Storage | 50MB | 5GB          | Unlimited           |
| Calendar Sync    | ❌   | ✅           | ✅                  |
| RAG Queries      | ❌   | ✅           | ✅                  |
| Priority Support | ❌   | ❌           | ✅                  |

## 🔧 Project Structure

```
whatsappagent/
├── apps/
│   ├── dashboard/        # Next.js dashboard app (Admin + User)
│   └── landing/          # Marketing landing page
├── packages/
│   ├── ai/               # AI/LangChain integration
│   ├── database/        # Prisma, MongoDB, Redis utilities
│   ├── security/        # RBAC, encryption, rate limiting
│   └── whatsapp/        # WhatsApp Cloud API client
├── services/             # Microservices (Express.js)
│   ├── api-gateway/     # Central gateway with Swagger
│   ├── agent/           # Multi-agent orchestration
│   ├── rag/             # Graph RAG service
│   ├── workflow/        # Temporal.io workflows
│   ├── auth/            # Authentication service
│   ├── billing/         # Stripe integration
│   ├── calendar/        # Calendar sync service
│   └── messaging/       # WhatsApp messaging
├── docs/
│   ├── html/            # Main documentation
│   └── api/             # API reference (Swagger UI)
├── infrastructure/
│   ├── k8s/             # Kubernetes manifests
│   └── monitoring/      # Prometheus, Grafana configs
└── tests/               # Unit & integration tests
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm vitest run tests/unit/api/auth.test.ts
```

## 🔐 Security Features

- **RBAC** - Role-based access control (Admin, User)
- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Per-user API rate limits
- **Encryption** - AES-256 at rest, TLS 1.3 in transit
- **GDPR Compliant** - Data export, deletion, consent management

## 📦 Deployment

The platform is **Kubernetes-ready** with:

- Auto-scaling configurations
- Health checks & readiness probes
- Service mesh (Istio) configuration
- Prometheus metrics & Grafana dashboards
- Log aggregation with Loki
- Distributed tracing with Jaeger

See [Deployment Guide](docs/DEPLOYMENT_RUNBOOK.md) for production setup.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [LangChain](https://langchain.dev/) - AI framework
- [Temporal.io](https://temporal.io/) - Workflow orchestration
- [Qdrant](https://qdrant.tech/) - Vector database
- [Neo4j](https://neo4j.com/) - Graph database
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp) - Messaging platform
- [Next.js](https://nextjs.org/) - React framework
