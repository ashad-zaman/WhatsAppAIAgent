export type AppEnv = 'development' | 'staging' | 'production';
export type LogLevel = 0 | 1 | 2 | 3 | 4;
export type AgentType = 'reminder' | 'calendar' | 'document' | 'conversation' | 'voice';
export type MessageType = 'text' | 'voice' | 'document' | 'image' | 'video' | 'location' | 'contact';
export type MessageDirection = 'inbound' | 'outbound';
export type Channel = 'whatsapp' | 'dashboard' | 'voice' | 'api';
export type ReminderStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type DocumentStatus = 'processing' | 'indexed' | 'failed';
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type CalendarProvider = 'google' | 'outlook';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  phone?: string;
  passwordHash?: string;
  fullName: string;
  timezone: string;
  plan: SubscriptionPlan;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastActiveAt?: Date;
}

export interface Organization extends BaseEntity {
  name: string;
  ownerId: string;
  settings: Record<string, unknown>;
}

export interface OrganizationMember {
  orgId: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface Agent extends BaseEntity {
  orgId: string;
  name: string;
  type: AgentType;
  config: AgentConfig;
  systemPrompt: string;
  isActive: boolean;
  capabilities: string[];
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentTool[];
  memoryLimit?: number;
  responseDelay?: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: string;
}

export interface Reminder extends BaseEntity {
  userId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  timezone: string;
  repeatType: RepeatType;
  repeatInterval: number;
  repeatEndDate?: Date;
  status: ReminderStatus;
  source: Channel;
  metadata?: Record<string, unknown>;
}

export interface SharedReminder {
  id: string;
  reminderId: string;
  sharedWithUserId: string;
  permission: 'view' | 'edit';
  createdAt: Date;
}

export interface Document extends BaseEntity {
  userId: string;
  orgId?: string;
  title: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  version: number;
  metadata: Record<string, unknown>;
  status: DocumentStatus;
  chunkCount?: number;
}

export interface DocumentChunk extends BaseEntity {
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

export interface Message extends BaseEntity {
  conversationId: string;
  userId: string;
  agentId?: string;
  direction: MessageDirection;
  channel: Channel;
  messageType: MessageType;
  content: MessageContent;
  metadata: MessageMetadata;
  context: MessageContext;
  embeddings?: number[];
}

export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  transcription?: string;
}

export interface MessageMetadata {
  whatsappMessageId?: string;
  typingIndicator?: boolean;
  read?: boolean;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface MessageContext {
  sessionId: string;
  turnCount: number;
  parentMessageId?: string;
  intent?: string;
  entities?: Record<string, unknown>;
}

export interface Session {
  id: string;
  userId: string;
  agentId?: string;
  channel: Channel;
  state: SessionState;
  context: SessionContext;
  preferences: SessionPreferences;
  expiresAt: Date;
}

export interface SessionState {
  currentNode: string;
  variables: Record<string, unknown>;
  memory: Record<string, unknown>;
}

export interface SessionContext {
  lastIntent?: string;
  entities: Record<string, unknown>;
  slotsFilled: string[];
}

export interface SessionPreferences {
  language: string;
  tone: 'formal' | 'friendly' | 'casual';
  notifications: boolean;
}

export interface CalendarToken {
  id: string;
  userId: string;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export interface CalendarEvent extends BaseEntity {
  userId: string;
  provider: CalendarProvider;
  externalId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  attendees: CalendarAttendee[];
  isAllDay: boolean;
  reminder?: number;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface Subscription extends BaseEntity {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface UsageMetrics {
  id: string;
  userId: string;
  metricType: string;
  count: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface RAGQuery {
  query: string;
  userId: string;
  orgId?: string;
  filters?: RAGFilters;
  topK?: number;
  includeGraph?: boolean;
}

export interface RAGFilters {
  documentIds?: string[];
  topics?: string[];
  dateRange?: { start: Date; end: Date };
  source?: string[];
}

export interface RAGResult {
  answer: string;
  sources: RAGSource[];
  context: RAGContext;
  metadata: {
    tokensUsed: number;
    latencyMs: number;
    model: string;
  };
}

export interface RAGSource {
  documentId: string;
  chunkId: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface RAGContext {
  vectorResults: VectorSearchResult[];
  graphResults: GraphSearchResult[];
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

export interface GraphSearchResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  config: WorkflowConfig;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: AgentType;
  action: string;
  input: Record<string, unknown>;
  condition?: WorkflowCondition;
  onSuccess?: string;
  onFailure?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface WorkflowConfig {
  timeout?: number;
  retryCount?: number;
  parallel?: boolean;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: string;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppMetadata {
  displayPhoneNumber: string;
  phoneNumberId: string;
}

export interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  image?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; filename: string };
  location?: { latitude: number; longitude: number; name?: string };
  context?: { id: string };
}

export interface WhatsAppStatus {
  id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';
  timestamp: string;
  conversation?: {
    id: string;
    expiration_timestamp: string;
    origin: { type: string };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}
