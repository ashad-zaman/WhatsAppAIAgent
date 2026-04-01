export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface DataExport {
  userId: string;
  exportedAt: Date;
  data: {
    profile: any;
    messages: any[];
    settings: any;
    activity: any;
  };
  format: 'json' | 'csv';
}

export interface DataDeletionRequest {
  userId: string;
  requestedAt: Date;
  retentionUntil?: Date;
  cascadeDelete: boolean;
  services: string[];
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataProcessingRecord {
  service: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  recipients: string[];
}

export interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  deletionMethod: 'permanent' | 'anonymize' | 'archive';
  requiresUserConsent: boolean;
}
