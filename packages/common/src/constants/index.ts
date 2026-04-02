export const APP_ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
} as const;

export const AGENT_TYPES = {
  REMINDER: 'reminder',
  CALENDAR: 'calendar',
  DOCUMENT: 'document',
  CONVERSATION: 'conversation',
  VOICE: 'voice',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  VOICE: 'voice',
  DOCUMENT: 'document',
  IMAGE: 'image',
  VIDEO: 'video',
  LOCATION: 'location',
  CONTACT: 'contact',
} as const;

export const MESSAGE_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
} as const;

export const CHANNELS = {
  WHATSAPP: 'whatsapp',
  DASHBOARD: 'dashboard',
  VOICE: 'voice',
  API: 'api',
} as const;

export const REMINDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

export const REPEAT_TYPES = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const DOCUMENT_STATUS = {
  PROCESSING: 'processing',
  INDEXED: 'indexed',
  FAILED: 'failed',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  TRIALING: 'trialing',
} as const;

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  AGENTS_CREATE: 'agents:create',
  AGENTS_READ: 'agents:read',
  AGENTS_UPDATE: 'agents:update',
  AGENTS_DELETE: 'agents:delete',
  REMINDERS_CREATE: 'reminders:create',
  REMINDERS_READ: 'reminders:read',
  REMINDERS_UPDATE: 'reminders:update',
  REMINDERS_DELETE: 'reminders:delete',
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_DELETE: 'documents:delete',
  CALENDAR_SYNC: 'calendar:sync',
  BILLING_MANAGE: 'billing:manage',
} as const;

export const KAFKA_TOPICS = {
  MESSAGES_INBOUND: 'messages.inbound',
  MESSAGES_OUTBOUND: 'messages.outbound',
  AGENT_INTENT: 'agent.intent',
  AGENT_TASK: 'agent.task',
  AGENT_RESULT: 'agent.result',
  AGENT_NOTIFY: 'agent.notify',
  REMINDER_TRIGGER: 'reminder.trigger',
  CALENDAR_SYNC: 'calendar.sync',
  DOCUMENT_INDEX: 'document.index',
  WORKFLOW_EVENT: 'workflow.event',
  NOTIFICATIONS: 'notifications',
} as const;

export const REDIS_KEYS = {
  SESSION: 'session',
  USER_PREFERENCES: 'user:preferences',
  AGENT_STATE: 'agent:state',
  RATE_LIMIT: 'rate:limit',
  CACHE: 'cache',
  LOCK: 'lock',
  QUEUE: 'queue',
} as const;

export const VECTOR_DIMENSIONS = {
  OPENAI_ADA_002: 1536,
  OPENAI_TEXT_EMBEDDING_3_LARGE: 3072,
} as const;

export const LLM_MODELS = {
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_4: 'gpt-4',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
} as const;

export const WHATSAPP_MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  DOCUMENT: 'document',
  STICKER: 'sticker',
  LOCATION: 'location',
  CONTACTS: 'contacts',
  REACTION: 'reaction',
  INTERACTIVE: 'interactive',
} as const;

export const CALENDAR_PROVIDERS = {
  GOOGLE: 'google',
  OUTLOOK: 'outlook',
} as const;
