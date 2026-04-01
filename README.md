# WhatsApp AI Agent Platform

A production-grade SaaS platform for building AI-powered WhatsApp assistants with multi-agent orchestration, Graph RAG, and autonomous workflow management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)

## 🚀 Features

- **Multi-Agent Orchestration** - LangChain/LangGraph powered AI agents that collaborate on complex tasks
- **Graph RAG** - Combine vector embeddings with knowledge graphs for accurate, contextual AI responses
- **WhatsApp Integration** - Full WhatsApp Cloud API integration for sending and receiving messages
- **Smart Reminders** - AI-powered reminder system with plan-based access control
- **Calendar Management** - Google/Outlook calendar sync with OAuth
- **Document Intelligence** - Upload, process, and query documents with RAG
- **Workflow Automation** - Temporal.io orchestration for reliable autonomous workflows
- **Stripe Billing** - Subscription management with Free/Pro/Enterprise plans

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
│   ├── dashboard/        # Next.js dashboard app
│   └── landing/          # Marketing landing page
├── packages/
│   ├── ai/               # AI/LangChain integration
│   ├── database/        # Prisma & database utilities
│   ├── security/        # RBAC, encryption, rate limiting
│   └── whatsapp/        # WhatsApp Cloud API client
├── services/            # Microservices (Express.js)
│   ├── agent/           # Multi-agent orchestration
│   ├── api-gateway/     # API gateway with Swagger
│   ├── rag/             # RAG service
│   └── workflow/        # Temporal.io workflows
├── docs/
│   ├── html/            # Main documentation
│   └── api/             # API reference (Swagger UI)
├── infrastructure/       # Kubernetes & monitoring configs
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

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [LangChain](https://langchain.dev/) - AI framework
- [Temporal.io](https://temporal.io/) - Workflow orchestration
- [Qdrant](https://qdrant.tech/) - Vector database
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp) - Messaging platform
