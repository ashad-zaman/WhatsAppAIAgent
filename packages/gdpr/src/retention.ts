import { RetentionPolicy } from './types';

export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataType: 'user_profile',
    retentionDays: 365 * 100, // Until account deletion
    deletionMethod: 'permanent',
    requiresUserConsent: false,
  },
  {
    dataType: 'messages',
    retentionDays: 90,
    deletionMethod: 'permanent',
    requiresUserConsent: false,
  },
  {
    dataType: 'ai_conversation_context',
    retentionDays: 30,
    deletionMethod: 'permanent',
    requiresUserConsent: false,
  },
  {
    dataType: 'application_logs',
    retentionDays: 365,
    deletionMethod: 'anonymize',
    requiresUserConsent: false,
  },
  {
    dataType: 'audit_logs',
    retentionDays: 365 * 7,
    deletionMethod: 'archive',
    requiresUserConsent: false,
  },
  {
    dataType: 'analytics_data',
    retentionDays: 365,
    deletionMethod: 'anonymize',
    requiresUserConsent: false,
  },
  {
    dataType: 'payment_records',
    retentionDays: 365 * 7,
    deletionMethod: 'archive',
    requiresUserConsent: false,
  },
  {
    dataType: 'session_data',
    retentionDays: 30,
    deletionMethod: 'permanent',
    requiresUserConsent: false,
  },
  {
    dataType: 'marketing_data',
    retentionDays: 730,
    deletionMethod: 'permanent',
    requiresUserConsent: true,
  },
];

export class RetentionManager {
  private policies: Map<string, RetentionPolicy>;

  constructor(customPolicies?: RetentionPolicy[]) {
    this.policies = new Map();
    
    for (const policy of DEFAULT_RETENTION_POLICIES) {
      this.policies.set(policy.dataType, policy);
    }
    
    if (customPolicies) {
      for (const policy of customPolicies) {
        this.policies.set(policy.dataType, policy);
      }
    }
  }

  getPolicy(dataType: string): RetentionPolicy | undefined {
    return this.policies.get(dataType);
  }

  getRetentionDate(dataType: string, fromDate: Date = new Date()): Date | null {
    const policy = this.policies.get(dataType);
    if (!policy) return null;
    
    const retentionMs = policy.retentionDays * 24 * 60 * 60 * 1000;
    return new Date(fromDate.getTime() + retentionMs);
  }

  isExpired(dataType: string, createdAt: Date): boolean {
    const retentionDate = this.getRetentionDate(dataType, createdAt);
    if (!retentionDate) return false;
    
    return new Date() > retentionDate;
  }

  getExpiredDataTypes(createdAt: Date): string[] {
    const expired: string[] = [];
    
    for (const [dataType, policy] of this.policies) {
      if (this.isExpired(dataType, createdAt)) {
        expired.push(dataType);
      }
    }
    
    return expired;
  }

  requiresConsent(dataType: string): boolean {
    const policy = this.policies.get(dataType);
    return policy?.requiresUserConsent ?? false;
  }

  getAllPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }
}
