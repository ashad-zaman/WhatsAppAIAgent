import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

interface TestUser {
  email: string;
  password: string;
  token?: string;
  userId?: string;
}

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
  },
};

const testUser: TestUser = {
  email: 'smoke-test@example.com',
  password: 'SmokeTest123!',
};

function setupUser(): TestUser {
  const registerRes = http.post(
    `${API_BASE}/auth/register`,
    JSON.stringify({
      email: testUser.email,
      password: testUser.password,
      name: 'Smoke Test User',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (registerRes.status === 201 || registerRes.status === 200) {
    const body = JSON.parse(registerRes.body as string);
    testUser.token = body.token || body.accessToken;
    testUser.userId = body.userId || body.user?.id;
  } else {
    const loginRes = http.post(
      `${API_BASE}/auth/login`,
      JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body as string);
      testUser.token = body.token || body.accessToken;
      testUser.userId = body.userId || body.user?.id;
    }
  }

  return testUser;
}

export function setup() {
  return setupUser();
}

export default function (data: TestUser) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  group('Core Endpoints', () => {
    const start = Date.now();
    const healthRes = http.get(`${BASE_URL}/health`);
    responseTime.add(Date.now() - start);
    
    const isHealthy = check(healthRes, {
      'health check passes': (r) => r.status === 200,
      'response is JSON': (r) => {
        try {
          JSON.parse(r.body as string);
          return true;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!isHealthy);
  });

  group('Authentication', () => {
    const profileRes = http.get(`${API_BASE}/users/profile`, { headers });
    check(profileRes, {
      'profile accessible with auth': (r) => r.status === 200,
    });
    errorRate.add(profileRes.status >= 400);
  });

  group('Agents', () => {
    const agentsRes = http.get(`${API_BASE}/agents`, { headers });
    check(agentsRes, {
      'agents endpoint accessible': (r) => r.status === 200,
    });
    errorRate.add(agentsRes.status >= 400);
  });

  group('RAG', () => {
    const ragRes = http.post(
      `${API_BASE}/rag/query`,
      JSON.stringify({
        query: 'What services do you offer?',
        topK: 3,
      }),
      { headers }
    );
    check(ragRes, {
      'RAG query works': (r) => r.status === 200 || r.status === 400,
    });
    errorRate.add(ragRes.status >= 500);
  });

  group('Reminders', () => {
    const remindersRes = http.get(`${API_BASE}/reminders`, { headers });
    check(remindersRes, {
      'reminders endpoint accessible': (r) => r.status === 200,
    });
    errorRate.add(remindersRes.status >= 400);
  });

  sleep(1);
}

export function handleSummary(data: {
  metrics: Record<string, unknown>;
}) {
  return {
    stdout: textSummary(data),
    'smoke-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data: { metrics: Record<string, unknown> }) {
  const metrics = data.metrics;
  let output = '\n=== SMOKE TEST RESULTS ===\n';
  
  const checks = metrics['checks'] as { values?: Record<string, number> } | undefined;
  if (checks?.values) {
    output += `Pass Rate: ${((checks.values['passes'] / (checks.values['passes'] + checks.values['fails'])) * 100).toFixed(1)}%\n`;
  }
  
  const httpDuration = metrics['http_req_duration'] as { values?: Record<string, number> } | undefined;
  if (httpDuration?.values) {
    output += `Avg Response: ${httpDuration.values['avg']?.toFixed(2) || 'N/A'}ms\n`;
    output += `p95 Response: ${httpDuration.values['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
  }
  
  return output;
}
