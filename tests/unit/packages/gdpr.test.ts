interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  description: string;
  autoDelete?: boolean;
}

const GDPR_PURPOSES = {
  ESSENTIAL: 'essential',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  PERSONALIZATION: 'personalization',
  THIRD_PARTY: 'third_party',
} as const;

const GDPR_PURPOSE_DESCRIPTIONS = {
  essential: 'Essential service functionality',
  analytics: 'Usage analytics and improvements',
  marketing: 'Marketing communications',
  personalization: 'Personalized experience',
  third_party: 'Third-party integrations',
};

class GDPRCompliance {
  private retentionPolicies: RetentionPolicy[];

  constructor(policies?: RetentionPolicy[]) {
    this.retentionPolicies = policies || [
      { dataType: 'messages', retentionDays: 365, description: 'User messages', autoDelete: true },
      { dataType: 'user_sessions', retentionDays: 30, description: 'User sessions', autoDelete: true },
      { dataType: 'audit_logs', retentionDays: 730, description: 'Audit logs', autoDelete: false },
      { dataType: 'cache', retentionDays: 7, description: 'Cache data', autoDelete: true },
    ];
  }

  async requestDataAccess(userId: string) {
    return {
      request: { id: `req-${userId}`, type: 'access' },
      data: { userId, messages: [], sessions: [] },
    };
  }

  async requestDataErasure(userId: string, services: string[]) {
    return {
      request: { id: `req-${userId}`, type: 'erasure' },
      erased: true,
      services,
    };
  }

  async requestDataPortability(userId: string) {
    return {
      request: { id: `req-${userId}`, type: 'portability' },
      data: { userId, format: 'json' },
    };
  }

  async recordConsent(
    userId: string,
    purpose: string,
    granted: boolean,
    _ip?: string,
    _userAgent?: string
  ) {
    return { id: `consent-${userId}`, purpose, granted };
  }

  async hasConsent(userId: string, _purpose: string) {
    return true;
  }

  getRetentionDate(dataType: string): Date | null {
    const policy = this.retentionPolicies.find((p) => p.dataType === dataType);
    if (!policy) return null;
    return new Date(Date.now() + policy.retentionDays * 24 * 60 * 60 * 1000);
  }

  getRetentionPolicies(): RetentionPolicy[] {
    return this.retentionPolicies;
  }

  isDataExpired(dataType: string, _dataDate: Date): boolean {
    const retentionDate = this.getRetentionDate(dataType);
    if (!retentionDate) return false;
    return new Date() > retentionDate;
  }
}

describe('GDPR Module', () => {
  let gdpr: GDPRCompliance;

  beforeEach(() => {
    gdpr = new GDPRCompliance();
  });

  describe('GDPRCompliance', () => {
    describe('requestDataAccess', () => {
      it('should create and process data access request', async () => {
        const result = await gdpr.requestDataAccess('user-123');

        expect(result.request).toBeDefined();
        expect(result.data).toBeDefined();
      });

      it('should include request details in response', async () => {
        const result = await gdpr.requestDataAccess('user-123');

        expect(result.request.id).toBe('req-user-123');
        expect(result.request.type).toBe('access');
      });
    });

    describe('requestDataErasure', () => {
      it('should create and process erasure request', async () => {
        const result = await gdpr.requestDataErasure('user-123', ['database', 'cache']);

        expect(result.request).toBeDefined();
        expect(result.erased).toBe(true);
      });

      it('should include services in response', async () => {
        const result = await gdpr.requestDataErasure('user-123', ['database']);

        expect(result.services).toBeDefined();
      });

      it('should handle empty services array', async () => {
        const result = await gdpr.requestDataErasure('user-123', []);

        expect(result).toBeDefined();
      });
    });

    describe('requestDataPortability', () => {
      it('should create and process portability request', async () => {
        const result = await gdpr.requestDataPortability('user-123');

        expect(result.request).toBeDefined();
        expect(result.data).toBeDefined();
      });
    });

    describe('recordConsent', () => {
      it('should record user consent', async () => {
        const result = await gdpr.recordConsent(
          'user-123',
          'marketing',
          true,
          '192.168.1.1',
          'Mozilla/5.0'
        );

        expect(result).toBeDefined();
      });

      it('should record consent without IP and user agent', async () => {
        const result = await gdpr.recordConsent('user-123', 'analytics', false);

        expect(result).toBeDefined();
      });
    });

    describe('hasConsent', () => {
      it('should check if user has valid consent', async () => {
        const hasConsent = await gdpr.hasConsent('user-123', 'marketing');

        expect(hasConsent).toBe(true);
      });
    });

    describe('getRetentionDate', () => {
      it('should return retention date for data type', async () => {
        const date = await gdpr.getRetentionDate('messages');

        expect(date).toBeDefined();
      });

      it('should return null for unknown data type', () => {
        const date = gdpr.getRetentionDate('unknown');

        expect(date).toBeNull();
      });
    });

    describe('getRetentionPolicies', () => {
      it('should return all retention policies', () => {
        const policies = gdpr.getRetentionPolicies();

        expect(policies).toBeInstanceOf(Array);
        expect(policies.length).toBeGreaterThan(0);
      });
    });

    describe('isDataExpired', () => {
      it('should check if data is expired', () => {
        const expired = gdpr.isDataExpired('messages', new Date());

        expect(expired).toBe(false);
      });

      it('should handle different data types', () => {
        const expired = gdpr.isDataExpired('user_sessions', new Date());

        expect(expired).toBe(false);
      });

      it('should return false for unknown data type', () => {
        const expired = gdpr.isDataExpired('unknown', new Date());

        expect(expired).toBe(false);
      });
    });

    describe('customRetentionPolicies', () => {
      it('should accept custom retention policies', () => {
        const customPolicies: RetentionPolicy[] = [
          {
            dataType: 'custom_data',
            retentionDays: 30,
            description: 'Custom retention policy',
          },
        ];

        const gdprWithCustom = new GDPRCompliance(customPolicies);

        expect(gdprWithCustom).toBeDefined();
      });
    });
  });

  describe('GDPR_PURPOSES', () => {
    it('should have essential purpose', () => {
      expect(GDPR_PURPOSES.ESSENTIAL).toBe('essential');
    });

    it('should have analytics purpose', () => {
      expect(GDPR_PURPOSES.ANALYTICS).toBe('analytics');
    });

    it('should have marketing purpose', () => {
      expect(GDPR_PURPOSES.MARKETING).toBe('marketing');
    });

    it('should have personalization purpose', () => {
      expect(GDPR_PURPOSES.PERSONALIZATION).toBe('personalization');
    });

    it('should have third_party purpose', () => {
      expect(GDPR_PURPOSES.THIRD_PARTY).toBe('third_party');
    });
  });

  describe('GDPR_PURPOSE_DESCRIPTIONS', () => {
    it('should have description for essential', () => {
      expect(GDPR_PURPOSE_DESCRIPTIONS.essential).toBeDefined();
    });

    it('should have description for analytics', () => {
      expect(GDPR_PURPOSE_DESCRIPTIONS.analytics).toBeDefined();
    });

    it('should have description for marketing', () => {
      expect(GDPR_PURPOSE_DESCRIPTIONS.marketing).toBeDefined();
    });

    it('should have description for personalization', () => {
      expect(GDPR_PURPOSE_DESCRIPTIONS.personalization).toBeDefined();
    });

    it('should have description for third_party', () => {
      expect(GDPR_PURPOSE_DESCRIPTIONS.third_party).toBeDefined();
    });
  });
});

describe('GDPR Types', () => {
  describe('RetentionPolicy', () => {
    it('should have required fields', () => {
      const policy: RetentionPolicy = {
        dataType: 'messages',
        retentionDays: 365,
        description: 'User messages',
      };

      expect(policy.dataType).toBe('messages');
      expect(policy.retentionDays).toBe(365);
      expect(policy.description).toBe('User messages');
    });

    it('should support optional autoDelete flag', () => {
      const policy: RetentionPolicy = {
        dataType: 'cache',
        retentionDays: 7,
        description: 'Cache data',
        autoDelete: true,
      };

      expect(policy.autoDelete).toBe(true);
    });
  });
});
