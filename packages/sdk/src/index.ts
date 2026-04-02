export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

export interface UserProfile extends User {
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: "reminder" | "calendar" | "document" | "conversation" | "voice";
  config: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
  };
  systemPrompt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  timezone: string;
  repeatType: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  repeatInterval: number;
  repeatEndDate?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  status: "uploading" | "processing" | "indexed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
}

export interface RagQueryResult {
  answer: string;
  sources: unknown[];
  metadata: {
    tokensUsed: number;
    latencyMs: number;
    model: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  location?: string;
  meetingLink?: string;
  source: "google" | "outlook" | "local";
}

export interface UserPreferences {
  language: string;
  notifications: boolean;
  timezone: string;
  tone: "formal" | "friendly" | "casual";
}

export interface CreateAgentParams {
  name: string;
  type: Agent["type"];
  config?: Agent["config"];
  systemPrompt?: string;
}

export interface CreateReminderParams {
  title: string;
  description?: string;
  scheduledAt: string;
  timezone?: string;
  repeatType?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  repeatInterval?: number;
  repeatEndDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateReminderParams {
  title?: string;
  description?: string;
  scheduledAt?: string;
  timezone?: string;
  repeatType?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  repeatInterval?: number;
  repeatEndDate?: string;
  status?: "pending" | "completed" | "cancelled";
  metadata?: Record<string, unknown>;
}

export interface RagQueryParams {
  query: string;
  documentIds?: string[];
  topK?: number;
}

export interface UpdateProfileParams {
  fullName?: string;
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesParams {
  language?: string;
  notifications?: boolean;
  timezone?: string;
  tone?: "formal" | "friendly" | "casual";
}

export class WhatsAppAIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams(query);
      url += `?${params.toString()}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as ApiResponse<T>;

    if (!data.success) {
      throw new Error(data.error?.message || "Request failed");
    }

    return data.data as T;
  }

  auth = {
    register: (params: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
    }) =>
      this.request<{
        user: User;
        token: string;
        refreshToken: string;
        apiKey: string;
      }>("POST", "/api/auth/register", params),

    login: (params: { email: string; password: string }) =>
      this.request<{ user: User; token: string; refreshToken: string }>(
        "POST",
        "/api/auth/login",
        params,
      ),

    refresh: (refreshToken: string) =>
      this.request<{ token: string }>("POST", "/api/auth/refresh", {
        refreshToken,
      }),

    logout: () => this.request<{ message: string }>("POST", "/api/auth/logout"),

    me: () => this.request<{ user: User }>("GET", "/api/auth/me"),

    forgotPassword: (email: string) =>
      this.request<{ message: string }>("POST", "/api/auth/forgot-password", {
        email,
      }),

    resetPassword: (token: string, password: string) =>
      this.request<{ message: string }>("POST", "/api/auth/reset-password", {
        token,
        password,
      }),
  };

  users = {
    getProfile: () =>
      this.request<{ user: UserProfile }>("GET", "/api/users/profile"),

    updateProfile: (params: UpdateProfileParams) =>
      this.request<{ user: UserProfile }>("PUT", "/api/users/profile", params),

    deleteAccount: () =>
      this.request<{ message: string }>("DELETE", "/api/users/account"),

    getPreferences: () =>
      this.request<{ preferences: UserPreferences }>(
        "GET",
        "/api/users/preferences",
      ),

    updatePreferences: (params: UpdatePreferencesParams) =>
      this.request<{ preferences: UserPreferences }>(
        "PUT",
        "/api/users/preferences",
        params,
      ),

    uploadAvatar: (avatarUrl: string) =>
      this.request<{ user: { id: string; avatarUrl: string } }>(
        "POST",
        "/api/users/avatar",
        { avatarUrl },
      ),
  };

  agents = {
    list: (params?: { type?: Agent["type"]; isActive?: boolean }) =>
      this.request<{ agents: Agent[] }>(
        "GET",
        "/api/agents",
        params as Record<string, string>,
      ),

    create: (params: CreateAgentParams) =>
      this.request<{ agent: Agent }>("POST", "/api/agents", params),

    get: (id: string) =>
      this.request<{ agent: Agent }>("GET", `/api/agents/${id}`),

    update: (
      id: string,
      params: Partial<CreateAgentParams & { isActive: boolean }>,
    ) => this.request<{ agent: Agent }>("PUT", `/api/agents/${id}`, params),

    delete: (id: string) =>
      this.request<{ message: string }>("DELETE", `/api/agents/${id}`),

    test: (id: string, message: string) =>
      this.request<{
        testResult: { message: string; response: string; agent: string };
      }>("POST", `/api/agents/${id}/test`, { message }),
  };

  reminders = {
    list: (params?: { status?: string; from?: string; to?: string }) =>
      this.request<{ reminders: Reminder[] }>(
        "GET",
        "/api/reminders",
        params as Record<string, string>,
      ),

    create: (params: CreateReminderParams) =>
      this.request<{ reminder: Reminder }>("POST", "/api/reminders", params),

    get: (id: string) =>
      this.request<{ reminder: Reminder }>("GET", `/api/reminders/${id}`),

    update: (id: string, params: UpdateReminderParams) =>
      this.request<{ reminder: Reminder }>(
        "PUT",
        `/api/reminders/${id}`,
        params,
      ),

    delete: (id: string) =>
      this.request<{ message: string }>("DELETE", `/api/reminders/${id}`),

    complete: (id: string) =>
      this.request<{ reminder: Reminder }>(
        "POST",
        `/api/reminders/${id}/complete`,
      ),

    share: (id: string, userId: string, permission: "view" | "edit" = "view") =>
      this.request<{ sharedReminder: unknown }>(
        "POST",
        `/api/reminders/${id}/share`,
        {
          userId,
          permission,
        },
      ),

    getShared: () =>
      this.request<{ reminders: Reminder[] }>(
        "GET",
        "/api/reminders/shared/with-me",
      ),
  };

  documents = {
    search: (query: string, limit?: number) =>
      this.request<{ results: unknown[]; query: string }>(
        "GET",
        "/api/documents/search",
        {
          q: query,
          limit: limit?.toString(),
        },
      ),

    upload: (params: { title: string; fileType: string; fileSize: number }) =>
      this.request<{ document: Document }>(
        "POST",
        "/api/documents/upload",
        params,
      ),

    get: (id: string) =>
      this.request<{ document: Document }>("GET", `/api/documents/${id}`),

    delete: (id: string) =>
      this.request<{ message: string }>("DELETE", `/api/documents/${id}`),

    process: (id: string) =>
      this.request<{ message: string }>("POST", `/api/documents/${id}/process`),
  };

  calendar = {
    connectGoogle: () =>
      this.request<{ url: string }>("GET", "/api/calendar/connect/google"),

    connectOutlook: () =>
      this.request<{ url: string }>("GET", "/api/calendar/connect/outlook"),

    getEvents: (params?: { from?: string; to?: string }) =>
      this.request<{ events: CalendarEvent[] }>(
        "GET",
        "/api/calendar/events",
        params as Record<string, string>,
      ),

    sync: () => this.request<{ message: string }>("POST", "/api/calendar/sync"),

    getConflicts: () =>
      this.request<{ conflicts: unknown[] }>("GET", "/api/calendar/conflicts"),
  };

  rag = {
    search: (query: string, limit?: number) =>
      this.request<{ results: unknown[]; query: string }>(
        "GET",
        "/api/rag/search",
        {
          q: query,
          limit: limit?.toString(),
        },
      ),

    query: (params: RagQueryParams) =>
      this.request<RagQueryResult>("POST", "/api/rag/query", params),

    summarize: (documentId: string) =>
      this.request<{ summary: string; keyPoints: string[] }>(
        "POST",
        `/api/rag/summarize/${documentId}`,
      ),

    getChatHistory: (conversationId?: string) =>
      this.request<{ history: unknown[]; conversationId?: string }>(
        "GET",
        "/api/rag/chat/history",
        {
          conversationId: conversationId || "",
        },
      ),
  };

  billing = {
    getPlans: () =>
      this.request<{ plans: Plan[] }>("GET", "/api/billing/plans"),

    subscribe: (planId: string) =>
      this.request<{ subscription: Subscription }>(
        "POST",
        "/api/billing/subscribe",
        { planId },
      ),

    getSubscription: () =>
      this.request<{ subscription: Subscription }>(
        "GET",
        "/api/billing/subscription",
      ),

    cancel: () =>
      this.request<{ message: string }>("POST", "/api/billing/cancel"),

    getInvoices: () =>
      this.request<{ invoices: unknown[] }>("GET", "/api/billing/invoices"),

    getPortalUrl: () =>
      this.request<{ url: string }>("POST", "/api/billing/portal"),
  };
}

export function createClient(baseUrl?: string): WhatsAppAIClient {
  return new WhatsAppAIClient(baseUrl);
}

export default WhatsAppAIClient;
