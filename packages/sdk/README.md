# WhatsApp AI Agent Platform SDK

TypeScript/JavaScript SDK for the WhatsApp AI Agent Platform API.

## Installation

```bash
npm install @whatsapp-ai/sdk
```

Or with yarn:

```bash
yarn add @whatsapp-ai/sdk
```

## Usage

### Initialize the client

```typescript
import { createClient } from '@whatsapp-ai/sdk';

const client = createClient('https://api.whatsappagent.io');
```

### Authentication

```typescript
// Login
const { user, token, refreshToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Set token for subsequent requests
client.setToken(token);

// Register
const { user, token, apiKey } = await client.auth.register({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe'
});
```

### Manage Agents

```typescript
// List all agents
const { agents } = await client.agents.list();

// Create a new agent
const { agent } = await client.agents.create({
  name: 'My Reminder Agent',
  type: 'reminder',
  config: {
    model: 'gpt-4',
    temperature: 0.7
  },
  systemPrompt: 'You are a helpful reminder assistant.'
});

// Test an agent
const { testResult } = await client.agents.test(agent.id, 'Hello, how are you?');
```

### Manage Reminders

```typescript
// Create a reminder
const { reminder } = await client.reminders.create({
  title: 'Team standup',
  description: 'Daily standup meeting',
  scheduledAt: '2024-12-20T10:00:00Z',
  timezone: 'America/New_York',
  repeatType: 'daily',
  repeatInterval: 1
});

// List reminders
const { reminders } = await client.reminders.list({
  status: 'pending',
  from: '2024-12-01T00:00:00Z',
  to: '2024-12-31T23:59:59Z'
});

// Complete a reminder
const { reminder } = await client.reminders.complete(reminderId);

// Share a reminder
await client.reminders.share(reminderId, otherUserId, 'edit');
```

### RAG Queries

```typescript
// Query the knowledge base
const result = await client.rag.query({
  query: 'What are the product features?',
  documentIds: ['doc-id-1', 'doc-id-2'],
  topK: 5
});

console.log(result.answer);
console.log(result.sources);
console.log(result.metadata);
```

### Document Management

```typescript
// Search documents
const { results } = await client.documents.search('meeting notes', 10);

// Upload a document
const { document } = await client.documents.upload({
  title: 'Q4 Report',
  fileType: 'pdf',
  fileSize: 1024000
});

// Process a document
await client.documents.process(document.id);
```

### Calendar Integration

```typescript
// Connect Google Calendar
const { url } = await client.calendar.connectGoogle();

// Get events
const { events } = await client.calendar.getEvents({
  from: '2024-12-01T00:00:00Z',
  to: '2024-12-31T23:59:59Z'
});

// Sync calendar
await client.calendar.sync();
```

### Billing

```typescript
// Get available plans
const { plans } = await client.billing.getPlans();

// Subscribe to a plan
const { subscription } = await client.billing.subscribe('pro');

// Get current subscription
const { subscription } = await client.billing.getSubscription();

// Open billing portal
const { url } = await client.billing.getPortalUrl();
```

## Error Handling

All methods throw errors when the API returns an error response:

```typescript
try {
  const { user } = await client.auth.login({
    email: 'user@example.com',
    password: 'wrong-password'
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
  }
}
```

## API Documentation

For detailed API documentation, visit:
- Swagger UI: `/api/docs/`
- OpenAPI JSON: `/api/docs/swagger.json`
- Postman Collection: `/api/docs/postman`

## License

Proprietary - All rights reserved
