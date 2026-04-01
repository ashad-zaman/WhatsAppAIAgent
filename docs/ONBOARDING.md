# Developer Onboarding Guide

**Welcome to the WhatsApp AI Platform team!**

This guide will help you get started with our codebase and development workflow.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Common Tasks](#common-tasks)
6. [Testing](#testing)
7. [Code Standards](#code-standards)
8. [Resources](#resources)

---

## Getting Started

### Day 1 Checklist

- [ ] Set up your development environment
- [ ] Clone the repository
- [ ] Install dependencies
- [ ] Start local services
- [ ] Run the application
- [ ] Complete onboarding meeting
- [ ] Get access to required tools

### Required Access

| Tool | Purpose | How to Get Access |
|------|---------|-------------------|
| GitHub | Code repository | Already provided |
| AWS Console | Cloud resources | IT ticket |
| Kubernetes | Deployment | DevOps team |
| Grafana | Monitoring | DevOps team |
| Sentry | Error tracking | DevOps team |
| Stripe Dashboard | Payments | Lead engineer |

---

## Development Environment

### System Requirements

- macOS 12+ or Ubuntu 22.04+
- Node.js 20+
- Docker Desktop 4+
- pnpm 9+
- kubectl 1.28+
- Git 2.40+

### Installation

```bash
# Clone the repository
git clone https://github.com/whatsapp-ai/platform.git
cd platform

# Install pnpm
npm install -g pnpm@9

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Required environment variables:

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
OPENAI_API_KEY=your-api-key

# JWT
JWT_SECRET=your-secret-key-min-256-bits
```

### Starting Local Services

```bash
# Start all services with Docker Compose
docker-compose up -d postgres mongodb redis kafka zookeeper qdrant neo4j temporal

# Start API Gateway
pnpm --filter @whatsapp-ai/api-gateway dev

# Start Agent Service
pnpm --filter @whatsapp-ai/agent-service dev

# Start Dashboard
pnpm --filter @whatsapp-ai/dashboard dev
```

---

## Project Structure

```
whatsappagent/
├── apps/
│   └── dashboard/          # Next.js dashboard application
├── packages/
│   ├── common/              # Shared utilities
│   ├── config/              # Configuration management
│   ├── database/            # Database clients (Prisma, MongoDB, Redis)
│   ├── queue/               # Kafka queue utilities
│   ├── events/              # Event bus
│   ├── ai/                  # AI integration utilities
│   ├── whatsapp/            # WhatsApp API client
│   ├── sentry/              # Error tracking
│   ├── cdn/                 # CDN utilities
│   └── gdpr/                # GDPR compliance
├── services/
│   ├── api-gateway/         # Main API gateway
│   ├── agent/               # AI agent service
│   ├── rag/                 # RAG service
│   ├── messaging/           # Message processing
│   └── workflow/            # Workflow orchestration
├── infrastructure/
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # Infrastructure as code
└── tests/
    ├── unit/                # Unit tests
    ├── integration/         # Integration tests
    └── load/                # Load tests
```

---

## Core Concepts

### Architecture Overview

The WhatsApp AI Platform consists of:

1. **API Gateway** - Main entry point, handles authentication and routing
2. **Agent Service** - AI-powered message processing with LangGraph
3. **RAG Service** - Retrieval-Augmented Generation for knowledge base
4. **Messaging Service** - WhatsApp message handling
5. **Workflow Service** - Temporal.io workflow orchestration

### Multi-Agent System

Our AI system uses LangGraph for multi-agent orchestration:

```
User Message
    ↓
Router Agent (classify intent)
    ↓
┌─────────┼─────────┬──────────┐
↓         ↓        ↓          ↓
Calendar  Reminder  AI Chat   WhatsApp
Agent     Agent    Agent      Agent
```

### Data Flow

```
WhatsApp → Webhook → API Gateway → Message Queue
                                    ↓
                              Agent Service
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
               LangGraph       RAG Service    External APIs
                    ↓               ↓               ↓
                    └───────────────┼───────────────┘
                                    ↓
                              Response
                                    ↓
                              API Gateway → WhatsApp
```

### Database Schema

- **PostgreSQL** - User data, subscriptions, audit logs
- **MongoDB** - Messages, conversations, sessions
- **Redis** - Caching, rate limiting, sessions
- **Qdrant** - Vector embeddings for RAG
- **Neo4j** - Knowledge graph relationships

---

## Common Tasks

### Creating a New Service

1. Create service directory in `services/`
2. Add `package.json` with proper dependencies
3. Create Dockerfile using existing services as template
4. Add to docker-compose.yml
5. Add Kubernetes manifests
6. Add to CI/CD pipeline

### Adding a New API Endpoint

```typescript
// services/api-gateway/src/routes/example.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/example',
  authenticate,
  rateLimit({ max: 100 }),
  validateRequest(schema),
  async (req, res) => {
    // Implementation
  }
);

export default router;
```

### Adding a New Agent

```typescript
// services/agent/src/agents/example-agent.ts
import { StateGraph, END } from '@langchain/langgraph';
import { AIMessage, HumanMessage } from '@langchain/schema';

const state = {
  messages: [],
  context: {},
};

const graph = new StateGraph({ state })
  .addNode('process', processNode)
  .addEdge('__start__', 'process')
  .addEdge('process', END)
  .compile();
```

### Database Migrations

```bash
# Create new migration
pnpm --filter @whatsapp-ai/database prisma migrate dev --name add_new_table

# Apply migrations in production
kubectl exec -it deploy/api-gateway -- pnpm prisma migrate deploy
```

### Adding a New Kafka Topic

```yaml
# infrastructure/kafka/topics.yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: new-topic
  labels:
    strimzi.io/cluster: whatsapp-kafka
spec:
  partitions: 12
  replicas: 3
  config:
    retention.ms: 604800000  # 7 days
```

---

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# Load tests
pnpm test:load

# Specific service
pnpm --filter @whatsapp-ai/api-gateway test
```

### Writing Tests

```typescript
// Example unit test
import { describe, it, expect } from 'vitest';

describe('Example Service', () => {
  it('should process message correctly', async () => {
    const result = await processMessage('Hello!');
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
  });
});
```

### Test Coverage

```bash
# Generate coverage report
pnpm test --coverage

# View coverage
open coverage/index.html
```

---

## Code Standards

### TypeScript

- Use strict mode
- Avoid `any` type
- Use explicit return types
- Prefer interfaces over types for objects

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName` |
| Functions | camelCase | `getUser()` |
| Classes | PascalCase | `UserService` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Files | kebab-case | `user-service.ts` |
| Routes | kebab-case | `/api/user-profile` |

### Git Workflow

1. Create feature branch: `feature/your-feature-name`
2. Make changes with atomic commits
3. Write tests for your changes
4. Submit PR with description
5. Get code review approval
6. Squash and merge

### Commit Messages

```
feat: add new reminder functionality
fix: resolve message queue timeout issue
docs: update API documentation
refactor: simplify agent routing logic
test: add tests for RAG service
chore: update dependencies
```

---

## Resources

### Documentation
- [Architecture](./ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Deployment Runbook](./docs/DEPLOYMENT_RUNBOOK.md)
- [GDPR Compliance](./docs/GDPR_COMPLIANCE.md)

### Tools
- [Confluence](https://whatsappai.atlassian.net) - Internal wiki
- [Jira](https://whatsappai.atlassian.net) - Project tracking
- [Slack](#) - Team communication
- [Figma](#) - Design files

### Key Dependencies
- [Next.js 14](https://nextjs.org/docs)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [LlamaIndex](https://docs.llamaindex.ai/)
- [Prisma](https://prisma.io/docs)
- [Temporal](https://docs.temporal.io/)

---

## Getting Help

### First Week
- Pair with a buddy developer
- Attend team standups
- Complete onboarding tasks
- Shadow code reviews

### Ongoing
- Ask in Slack #engineering
- Check Confluence wiki
- Read existing PRs
- Don't hesitate to ask questions!

---

## Quick Reference

### Useful Commands

```bash
# Development
pnpm dev                    # Start all services in dev mode
pnpm build                  # Build all packages
pnpm lint                   # Lint code
pnpm typecheck             # Type check

# Docker
docker-compose up -d       # Start all services
docker-compose logs -f    # View logs
docker-compose down       # Stop services

# Kubernetes
kubectl get pods           # List pods
kubectl logs -f <pod>      # View logs
kubectl exec -it <pod> -- sh  # Shell into pod

# Database
pnpm prisma studio         # Open Prisma Studio
pnpm prisma migrate dev    # Run migrations
```

### Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local development setup |
| `turbo.json` | Monorepo configuration |
| `packages/config/` | Environment configuration |
| `services/api-gateway/` | Main API service |
| `infrastructure/k8s/` | Kubernetes manifests |

---

*Welcome aboard! We're excited to have you on the team.*
