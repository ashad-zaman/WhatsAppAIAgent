export type Plan = "free" | "pro" | "enterprise";

export interface PlanLimits {
  maxAgents: number;
  messagesPerMonth: number;
  remindersPerDay: number;
  documentStorageMB: number;
  calendarSync: boolean;
  voiceProcessing: boolean;
  sharedReminders: boolean;
  scheduledNotifications: boolean;
  customIntegrations: number;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxAgents: 5,
    messagesPerMonth: 100,
    remindersPerDay: 5,
    documentStorageMB: 100,
    calendarSync: true,
    voiceProcessing: false,
    sharedReminders: false,
    scheduledNotifications: false,
    customIntegrations: 0,
    prioritySupport: false,
  },
  pro: {
    maxAgents: -1, // unlimited
    messagesPerMonth: -1, // unlimited
    remindersPerDay: -1, // unlimited
    documentStorageMB: 10240, // 10GB
    calendarSync: true,
    voiceProcessing: true,
    sharedReminders: true,
    scheduledNotifications: true,
    customIntegrations: -1, // unlimited
    prioritySupport: true,
  },
  enterprise: {
    maxAgents: -1,
    messagesPerMonth: -1,
    remindersPerDay: -1,
    documentStorageMB: -1, // unlimited
    calendarSync: true,
    voiceProcessing: true,
    sharedReminders: true,
    scheduledNotifications: true,
    customIntegrations: -1,
    prioritySupport: true,
  },
};

export interface FeatureAccess {
  allowed: boolean;
  limit?: number;
  upgradeUrl?: string;
}

export function checkFeatureAccess(
  plan: Plan,
  feature: keyof PlanLimits,
): FeatureAccess {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];

  if (value === true || value === -1) {
    return { allowed: true };
  }

  if (typeof value === "number" && value > 0) {
    return { allowed: true, limit: value };
  }

  return {
    allowed: false,
    upgradeUrl: "/pricing",
  };
}

export function checkMessageLimit(
  plan: Plan,
  currentCount: number,
): { allowed: boolean; remaining?: number; upgradeUrl?: string } {
  const limit = PLAN_LIMITS[plan].messagesPerMonth;

  if (limit === -1) {
    return { allowed: true };
  }

  const remaining = limit - currentCount;
  if (remaining > 0) {
    return { allowed: true, remaining };
  }

  return {
    allowed: false,
    upgradeUrl: "/pricing",
  };
}

export function checkAgentLimit(
  plan: Plan,
  currentCount: number,
): { allowed: boolean; current: number; max: number; upgradeUrl?: string } {
  const max = PLAN_LIMITS[plan].maxAgents;

  if (max === -1) {
    return { allowed: true, current: currentCount, max: -1 };
  }

  if (currentCount < max) {
    return { allowed: true, current: currentCount, max };
  }

  return {
    allowed: false,
    current: currentCount,
    max,
    upgradeUrl: "/pricing",
  };
}

export function checkReminderLimit(
  plan: Plan,
  todayCount: number,
): { allowed: boolean; remaining?: number; upgradeUrl?: string } {
  const limit = PLAN_LIMITS[plan].remindersPerDay;

  if (limit === -1) {
    return { allowed: true };
  }

  const remaining = limit - todayCount;
  if (remaining > 0) {
    return { allowed: true, remaining };
  }

  return {
    allowed: false,
    upgradeUrl: "/pricing",
  };
}

export function checkDocumentStorage(
  plan: Plan,
  currentSizeMB: number,
): { allowed: boolean; remaining?: number; upgradeUrl?: string } {
  const limit = PLAN_LIMITS[plan].documentStorageMB;

  if (limit === -1) {
    return { allowed: true };
  }

  const remaining = limit - currentSizeMB;
  if (remaining > 0) {
    return { allowed: true, remaining };
  }

  return {
    allowed: false,
    upgradeUrl: "/pricing",
  };
}
