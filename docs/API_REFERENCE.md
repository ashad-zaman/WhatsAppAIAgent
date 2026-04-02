# WhatsApp AI Agent Platform - API Documentation

Production-grade SaaS WhatsApp AI Agent Platform API with Multi-Agent & Graph RAG microservices architecture.

**Version:** 1.0.0  
**OpenAPI:** 3.0.3  
**Base URL:** `/api`

---

## Authentication

All API endpoints (except public ones) require JWT Bearer token authentication.

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Auth

Authentication and user registration endpoints.

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| POST   | `/auth/register`        | Register a new user    |
| POST   | `/auth/login`           | User login             |
| POST   | `/auth/refresh`         | Refresh access token   |
| POST   | `/auth/logout`          | User logout            |
| GET    | `/auth/me`              | Get current user       |
| POST   | `/auth/forgot-password` | Request password reset |
| POST   | `/auth/reset-password`  | Reset password         |

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "plan": "FREE"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "apiKey": "sk-xxx"
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "plan": "FREE"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "password": "newpassword123"
}
```

---

### Users

User profile and preferences management.

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| GET    | `/users/profile`     | Get user profile        |
| PUT    | `/users/profile`     | Update user profile     |
| DELETE | `/users/account`     | Delete user account     |
| GET    | `/users/preferences` | Get user preferences    |
| PUT    | `/users/preferences` | Update user preferences |
| POST   | `/users/avatar`      | Upload avatar           |

#### Get Profile

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "plan": "PRO",
      "timezone": "UTC",
      "avatarUrl": "https://...",
      "isEmailVerified": true,
      "isPhoneVerified": false,
      "lastActiveAt": "2026-04-02T10:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

#### Update Profile

```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "timezone": "America/New_York",
  "avatarUrl": "https://..."
}
```

#### User Preferences

```json
{
  "language": "en",
  "notifications": true,
  "timezone": "UTC",
  "tone": "friendly"
}
```

**Tone options:** `formal`, `friendly`, `casual`

---

### Agents

AI Agent creation and management.

| Method | Endpoint       | Description  |
| ------ | -------------- | ------------ |
| GET    | `/agents`      | List agents  |
| POST   | `/agents`      | Create agent |
| GET    | `/agents/{id}` | Get agent    |
| PUT    | `/agents/{id}` | Update agent |
| DELETE | `/agents/{id}` | Delete agent |

#### Agent Types

- `reminder` - Reminder management agent
- `calendar` - Calendar scheduling agent
- `document` - Document processing agent
- `conversation` - Conversational AI agent
- `voice` - Voice processing agent

#### List Agents

```http
GET /api/agents?type=reminder&isActive=true
Authorization: Bearer <token>
```

#### Create Agent

```http
POST /api/agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Reminder Agent",
  "type": "reminder",
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "tools": [
      {
        "name": "create_reminder",
        "description": "Create a new reminder",
        "parameters": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "scheduledAt": { "type": "string" }
          }
        }
      }
    ]
  },
  "systemPrompt": "You are a helpful reminder assistant..."
}
```

#### Agent Response

```json
{
  "id": "uuid",
  "name": "My Reminder Agent",
  "type": "reminder",
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "tools": [...]
  },
  "systemPrompt": "You are a helpful reminder assistant...",
  "isActive": true,
  "createdAt": "2026-04-02T10:00:00Z",
  "updatedAt": "2026-04-02T10:00:00Z"
}
```

---

### Reminders

Reminder scheduling and management.

| Method | Endpoint                | Description     |
| ------ | ----------------------- | --------------- |
| GET    | `/reminders`            | List reminders  |
| POST   | `/reminders`            | Create reminder |
| GET    | `/reminders/{id}`       | Get reminder    |
| PUT    | `/reminders/{id}`       | Update reminder |
| DELETE | `/reminders/{id}`       | Delete reminder |
| POST   | `/reminders/{id}/share` | Share reminder  |

#### Repeat Types

- `none` - One-time reminder
- `daily` - Repeats daily
- `weekly` - Repeats weekly
- `monthly` - Repeats monthly
- `yearly` - Repeats yearly

#### Status

- `PENDING` - Not yet triggered
- `COMPLETED` - Has been completed
- `CANCELLED` - Cancelled by user

#### Create Reminder

```http
POST /api/reminders
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Call mom",
  "description": "Weekly call",
  "scheduledAt": "2026-04-03T17:00:00Z",
  "timezone": "America/New_York",
  "repeatType": "weekly",
  "repeatInterval": 1,
  "repeatEndDate": "2026-12-31T23:59:59Z"
}
```

#### Reminder Response

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Call mom",
  "description": "Weekly call",
  "scheduledAt": "2026-04-03T17:00:00Z",
  "timezone": "America/New_York",
  "repeatType": "WEEKLY",
  "repeatInterval": 1,
  "repeatEndDate": "2026-12-31T23:59:59Z",
  "status": "PENDING",
  "metadata": {},
  "createdAt": "2026-04-02T10:00:00Z",
  "updatedAt": "2026-04-02T10:00:00Z"
}
```

#### Share Reminder

```http
POST /api/reminders/{id}/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "uuid-of-user-to-share-with",
  "permission": "view"
}
```

**Permission options:** `view`, `edit`

---

### Documents

Document upload and management.

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | `/documents`      | List documents  |
| POST   | `/documents`      | Upload document |
| GET    | `/documents/{id}` | Get document    |
| DELETE | `/documents/{id}` | Delete document |

#### Document Status

- `uploading` - File being uploaded
- `processing` - Being processed for RAG
- `indexed` - Ready for queries
- `failed` - Processing failed

#### Upload Document

```http
POST /api/documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Q4 Report",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

#### Document Response

```json
{
  "id": "uuid",
  "title": "Q4 Report",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "status": "indexed",
  "createdAt": "2026-04-02T10:00:00Z",
  "updatedAt": "2026-04-02T10:05:00Z"
}
```

---

### Calendar

Calendar sync and event management.

| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| GET    | `/events`              | List events         |
| POST   | `/events`              | Create event        |
| GET    | `/events/{id}`         | Get event           |
| PUT    | `/events/{id}`         | Update event        |
| DELETE | `/events/{id}`         | Delete event        |
| POST   | `/calendar/connect`    | Connect calendar    |
| POST   | `/calendar/sync`       | Sync calendar       |
| DELETE | `/calendar/disconnect` | Disconnect calendar |

#### Connect Calendar

```http
POST /api/calendar/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "google",
  "accessToken": "ya29...",
  "refreshToken": "1//0g..."
}
```

**Providers:** `google`, `outlook`

#### Create Event

```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Weekly sync",
  "startTime": "2026-04-03T15:00:00Z",
  "endTime": "2026-04-03T16:00:00Z",
  "timezone": "America/New_York",
  "location": "Zoom",
  "attendees": ["user1@example.com", "user2@example.com"],
  "reminder": 15
}
```

---

### RAG

Retrieval-Augmented Generation endpoints.

| Method | Endpoint      | Description             |
| ------ | ------------- | ----------------------- |
| POST   | `/rag/query`  | Query documents with AI |
| GET    | `/rag/status` | Get RAG status          |
| GET    | `/rag/stats`  | Get RAG statistics      |

#### Query Documents

```http
POST /api/rag/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What are the key revenue metrics in the Q4 report?",
  "documentIds": ["doc-uuid-1", "doc-uuid-2"],
  "topK": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answer": "Based on the Q4 report, revenue increased by 23%...",
    "sources": [
      {
        "documentId": "doc-uuid-1",
        "title": "Q4 Report",
        "chunk": "Revenue increased by 23%...",
        "score": 0.95
      }
    ],
    "metadata": {
      "tokensUsed": 1500,
      "latencyMs": 2500,
      "model": "gpt-4"
    }
  }
}
```

---

### Billing

Subscription and billing management.

| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| GET    | `/billing`                 | Get subscription        |
| POST   | `/billing/upgrade`         | Upgrade plan            |
| POST   | `/billing/downgrade`       | Downgrade plan          |
| POST   | `/billing/cancel`          | Cancel subscription     |
| POST   | `/checkout/create-session` | Create checkout session |
| POST   | `/webhooks/stripe`         | Stripe webhook handler  |

#### Plans

| Plan       | Price  | Features                                                            |
| ---------- | ------ | ------------------------------------------------------------------- |
| FREE       | $0/mo  | 100 messages, 5 reminders, 1 agent                                  |
| PRO        | $29/mo | 5000 messages, 100 reminders, 5 agents, Calendar sync, Document RAG |
| ENTERPRISE | $99/mo | Unlimited everything, Custom integrations, Dedicated support        |

#### Create Checkout Session

```http
POST /api/checkout/create-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "pro",
  "successUrl": "https://app.example.com/billing/success",
  "cancelUrl": "https://app.example.com/billing/cancel"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
  }
}
```

#### Subscription Response

```json
{
  "id": "sub_xxx",
  "plan": "PRO",
  "status": "active",
  "currentPeriodEnd": "2026-05-02T00:00:00Z"
}
```

---

### Webhooks

Webhook endpoints for external integrations.

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| GET    | `/webhooks/whatsapp` | WhatsApp webhook verification |
| POST   | `/webhooks/whatsapp` | WhatsApp message handler      |
| POST   | `/webhooks/stripe`   | Stripe webhook handler        |

#### WhatsApp Webhook

WhatsApp Cloud API sends POST requests when users send messages:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "+1234567890",
                "id": "wamid.xxx",
                "timestamp": "1234567890",
                "text": { "body": "Hello AI" },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### Stripe Webhooks

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_xxx",
      "customer": "cus_xxx",
      "subscription": "sub_xxx"
    }
  }
}
```

**Event Types:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Schemas

### Common Responses

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "message": "Operation completed successfully"
  }
}
```

### User Schemas

#### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "plan": "FREE"
}
```

#### UserProfile

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "plan": "PRO",
  "timezone": "UTC",
  "avatarUrl": "https://...",
  "isEmailVerified": true,
  "isPhoneVerified": false,
  "lastActiveAt": "2026-04-02T10:00:00Z",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

#### UserPreferences

```json
{
  "language": "en",
  "notifications": true,
  "timezone": "UTC",
  "tone": "friendly"
}
```

### Request Schemas

#### RegisterRequest

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

#### LoginRequest

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### CreateAgentRequest

```json
{
  "name": "My Agent",
  "type": "reminder",
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "tools": [...]
  },
  "systemPrompt": "You are..."
}
```

#### CreateReminderRequest

```json
{
  "title": "Call mom",
  "description": "Weekly call",
  "scheduledAt": "2026-04-03T17:00:00Z",
  "timezone": "America/New_York",
  "repeatType": "weekly",
  "repeatInterval": 1,
  "repeatEndDate": "2026-12-31T23:59:59Z",
  "metadata": {}
}
```

#### RagQueryRequest

```json
{
  "query": "What is the revenue?",
  "documentIds": ["doc-uuid-1"],
  "topK": 5
}
```

#### Plan

```json
{
  "id": "pro",
  "name": "Pro",
  "price": 29,
  "features": ["unlimited_reminders", "calendar_sync", "document_rag"]
}
```

#### Subscription

```json
{
  "id": "sub_xxx",
  "plan": "PRO",
  "status": "active",
  "currentPeriodEnd": "2026-05-02T00:00:00Z"
}
```

---

## Error Codes

| Code                  | Description              |
| --------------------- | ------------------------ |
| `VALIDATION_ERROR`    | Invalid request data     |
| `UNAUTHORIZED`        | Invalid or expired token |
| `FORBIDDEN`           | Insufficient permissions |
| `NOT_FOUND`           | Resource not found       |
| `RATE_LIMIT_EXCEEDED` | Too many requests        |
| `INTERNAL_ERROR`      | Server error             |

---

## Rate Limiting

- **Authenticated:** 1000 requests/minute
- **Public:** 60 requests/minute

---

## Support

- **API Support:** api-support@whatsappagent.io
- **GitHub:** https://github.com/whatsapp-ai/platform
