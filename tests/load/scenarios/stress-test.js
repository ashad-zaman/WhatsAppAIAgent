import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

const errors = new Rate('errors');
const httpErrors = new Counter('http_errors');
const timeouts = new Counter('timeouts');

interface TestUser {
  email: string;
  password: string;
  token?: string;
}

export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '10s', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '10s', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.2'],
  },
};

const testUser: TestUser = {
  email: 'stress-test@example.com',
  password: 'StressTest123!',
};

export function setup() {
  const registerRes = http.post(
    `${API_BASE}/auth/register`,
    JSON.stringify({
      email: testUser.email,
      password: testUser.password,
      name: 'Stress Test User',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (registerRes.status === 201 || registerRes.status === 200) {
    const body = JSON.parse(registerRes.body as string);
    testUser.token = body.token || body.accessToken;
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
    }
  }

  return testUser;
}

export default function (data: TestUser) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  const urls = [
    { url: `${BASE_URL}/health`, weight: 20 },
    { url: `${API_BASE}/users/profile`, weight: 20 },
    { url: `${API_BASE}/agents`, weight: 20 },
    { url: `${API_BASE}/reminders`, weight: 20 },
    { url: `${API_BASE}/rag/query`, weight: 20 },
  ];

  const selectedUrl = weightedRandom(urls);
  
  const start = Date.now();
  const res = http.get(selectedUrl.url, { 
    headers: selectedUrl.url.includes('/api/') ? headers : undefined,
    timeout: '5s',
  });
  const duration = Date.now() - start;

  if (duration > 5000) {
    timeouts.add(1);
  }

  if (res.status >= 400) {
    httpErrors.add(1);
  }

  check(res, {
    'status is not 500': (r) => r.status < 500,
    'response received': (r) => r.body && r.body.length > 0,
  });

  errors.add(res.status >= 400);
  
  sleep(0.1);
}

function weightedRandom(items: { url: string; weight: number }[]): { url: string; weight: number } {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}

export function handleSummary(data: {
  metrics: Record<string, unknown>;
}) {
  return {
    stdout: textSummary(data),
    'stress-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data: { metrics: Record<string, unknown> }) {
  const metrics = data.metrics;
  let output = '\n=== STRESS TEST RESULTS ===\n';
  
  const httpErrors = metrics['http_errors'] as { values?: { count?: number } } | undefined;
  if (httpErrors?.values) {
    output += `HTTP Errors (4xx/5xx): ${httpErrors.values['count'] || 0}\n`;
  }
  
  const timeoutsCount = metrics['timeouts'] as { values?: { count?: number } } | undefined;
  if (timeoutsCount?.values) {
    output += `Timeouts (>5s): ${timeoutsCount.values['count'] || 0}\n`;
  }
  
  const httpDuration = metrics['http_req_duration'] as { values?: Record<string, number> } | undefined;
  if (httpDuration?.values) {
    output += `Avg Response: ${httpDuration.values['avg']?.toFixed(2) || 'N/A'}ms\n`;
    output += `p95 Response: ${httpDuration.values['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
    output += `p99 Response: ${httpDuration.values['p(99)']?.toFixed(2) || 'N/A'}ms\n`;
    output += `Max Response: ${httpDuration.values['max']?.toFixed(2) || 'N/A'}ms\n`;
  }
  
  const httpFailed = metrics['http_req_failed'] as { values?: Record<string, number> } | undefined;
  if (httpFailed?.values) {
    output += `Failure Rate: ${((httpFailed.values['rate'] || 0) * 100).toFixed(2)}%\n`;
  }
  
  return output;
}
