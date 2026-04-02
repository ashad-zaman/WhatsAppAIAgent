import { DataSubjectRequest, DataExport, ConsentRecord } from './types';

export class DataSubjectService {
  async createRequest(
    userId: string,
    type: DataSubjectRequest['type'],
    metadata?: Record<string, any>
  ): Promise<DataSubjectRequest> {
    return {
      id: `dsr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      status: 'pending',
      requestedAt: new Date(),
      metadata,
    };
  }

  async processAccessRequest(userId: string): Promise<DataExport> {
    return {
      userId,
      exportedAt: new Date(),
      data: {
        profile: await this.getProfileData(userId),
        messages: await this.getMessageData(userId),
        settings: await this.getSettingsData(userId),
        activity: await this.getActivityData(userId),
      },
      format: 'json',
    };
  }

  async processErasureRequest(
    userId: string,
    services: string[]
  ): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const service of services) {
      try {
        await this.deleteServiceData(userId, service);
        deleted.push(service);
      } catch (error) {
        console.error(`Failed to delete data for service ${service}:`, error);
        failed.push(service);
      }
    }

    return { deleted, failed };
  }

  async processPortabilityRequest(userId: string): Promise<DataExport> {
    const exportData = await this.processAccessRequest(userId);
    
    return {
      ...exportData,
      format: 'json',
    };
  }

  private async getProfileData(userId: string): Promise<any> {
    return {
      id: userId,
      exportedAt: new Date().toISOString(),
    };
  }

  private async getMessageData(userId: string): Promise<any[]> {
    return [];
  }

  private async getSettingsData(userId: string): Promise<any> {
    return {};
  }

  private async getActivityData(userId: string): Promise<any> {
    return {
      lastLogin: new Date().toISOString(),
      sessions: [],
    };
  }

  private async deleteServiceData(userId: string, service: string): Promise<void> {
    console.log(`Deleting ${service} data for user ${userId}`);
  }
}

export class ConsentManager {
  private consentRecords: Map<string, ConsentRecord[]> = new Map();

  async recordConsent(
    userId: string,
    purpose: string,
    granted: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      purpose,
      granted,
      timestamp: new Date(),
      ipAddress,
      userAgent,
    };

    const existing = this.consentRecords.get(userId) || [];
    existing.push(record);
    this.consentRecords.set(userId, existing);

    return record;
  }

  async getConsent(userId: string, purpose: string): Promise<ConsentRecord | null> {
    const records = this.consentRecords.get(userId) || [];
    const sorted = records
      .filter(r => r.purpose === purpose)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return sorted[0] || null;
  }

  async getAllConsents(userId: string): Promise<ConsentRecord[]> {
    return this.consentRecords.get(userId) || [];
  }

  async withdrawConsent(userId: string, purpose: string): Promise<ConsentRecord> {
    return this.recordConsent(userId, purpose, false);
  }

  async hasValidConsent(userId: string, purpose: string): Promise<boolean> {
    const consent = await this.getConsent(userId, purpose);
    return consent?.granted ?? false;
  }
}

export const GDPR_PURPOSES = {
  ESSENTIAL: 'essential',
  FUNCTIONAL: 'functional',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
} as const;

export const GDPR_PURPOSE_DESCRIPTIONS: Record<string, string> = {
  [GDPR_PURPOSES.ESSENTIAL]: 'Required for the service to function',
  [GDPR_PURPOSES.FUNCTIONAL]: 'Enables enhanced features and preferences',
  [GDPR_PURPOSES.ANALYTICS]: 'Helps us understand how users use our service',
  [GDPR_PURPOSES.MARKETING]: 'Used for promotional communications',
};
