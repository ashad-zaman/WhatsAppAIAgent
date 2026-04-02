export * from './types';
export * from './retention';
export * from './services';

import { DataSubjectService, ConsentManager, GDPR_PURPOSES, GDPR_PURPOSE_DESCRIPTIONS } from './services';
import { RetentionManager } from './retention';
import { RetentionPolicy } from './types';

export class GDPRCompliance {
  private dataSubjectService: DataSubjectService;
  private consentManager: ConsentManager;
  private retentionManager: RetentionManager;

  constructor(customRetentionPolicies?: RetentionPolicy[]) {
    this.dataSubjectService = new DataSubjectService();
    this.consentManager = new ConsentManager();
    this.retentionManager = new RetentionManager(customRetentionPolicies);
  }

  async requestDataAccess(userId: string) {
    const request = await this.dataSubjectService.createRequest(userId, 'access');
    const data = await this.dataSubjectService.processAccessRequest(userId);
    
    return { request, data };
  }

  async requestDataErasure(userId: string, services: string[]) {
    const request = await this.dataSubjectService.createRequest(userId, 'erasure');
    const result = await this.dataSubjectService.processErasureRequest(userId, services);
    
    return { request, ...result };
  }

  async requestDataPortability(userId: string) {
    const request = await this.dataSubjectService.createRequest(userId, 'portability');
    const data = await this.dataSubjectService.processPortabilityRequest(userId);
    
    return { request, data };
  }

  async recordConsent(
    userId: string,
    purpose: string,
    granted: boolean,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.consentManager.recordConsent(userId, purpose, granted, ipAddress, userAgent);
  }

  async hasConsent(userId: string, purpose: string) {
    return this.consentManager.hasValidConsent(userId, purpose);
  }

  async getRetentionDate(dataType: string) {
    return this.retentionManager.getRetentionDate(dataType);
  }

  getRetentionPolicies() {
    return this.retentionManager.getAllPolicies();
  }

  isDataExpired(dataType: string, createdAt: Date) {
    return this.retentionManager.isExpired(dataType, createdAt);
  }
}

export { GDPR_PURPOSES, GDPR_PURPOSE_DESCRIPTIONS };
