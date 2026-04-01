import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { Options } from 'k6/types';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const agentDuration = new Trend('agent_duration');
const ragDuration = new Trend('rag_duration');
const reminderDuration = new Trend('reminder_duration');

interface UserCredentials {
  email: string;
  password: string;
  token?: string;
  userId?: string;
}

const testUsers = [
  { email: 'test1@example.com', password: 'TestPassword123!' },
  { email: 'test2@example.com', password: 'TestPassword123!' },
  { email: 'test3@example.com', password: 'TestPassword123!' },
  { email: 'test4@example.com', password: 'TestPassword123!' },
  { email: 'test5@example.com', password: 'TestPassword123!' },
];

function getRandomUser(): UserCredentials {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function setUpUser(user: UserCredentials): UserCredentials {
  const registerRes = http.post(
    `${API_BASE}/auth/register`,
    JSON.stringify({
      email: user.email,
      password: user.password,
      name: `Test User ${user.email}`,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (registerRes.status === 201 || registerRes.status === 200) {
    const body = JSON.parse(registerRes.body as string);
    user.token = body.token || body.accessToken;
    user.userId = body.userId || body.user?.id;
  } else {
    const loginRes = http.post(
      `${API_BASE}/auth/login`,
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body as string);
      user.token = body.token || body.accessToken;
      user.userId = body.userId || body.user?.id;
    }
  }

  return user;
}

function getAuthHeaders(token: string | undefined) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const options: Options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '10m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
    login_duration: ['p(95)<1000'],
    agent_duration: ['p(95)<2000'],
    rag_duration: ['p(95)<3000'],
    reminder_duration: ['p(95)<500'],
  },
};

export function setup() {
  const user = getRandomUser();
  return setUpUser(user);
}

export default function (data: UserCredentials) {
  const headers = getAuthHeaders(data.token);
  const userId = data.userId;

  group('Health Check', () => {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health endpoint is status 200': (r) => r.status === 200,
      'health response has status': (r) => JSON.parse(r.body as string).status === 'healthy',
    });
  });

  group('User Profile', () => {
    const profileRes = http.get(`${API_BASE}/users/profile`, { headers });
    const isSuccess = check(profileRes, {
      'profile endpoint is status 200': (r) => r.status === 200,
      'profile has email': (r) => !!JSON.parse(r.body as string).email,
    });
    errorRate.add(!isSuccess);
  });

  group('Agent Operations', () => {
    const listRes = http.get(`${API_BASE}/agents`, { headers });
    const isListSuccess = check(listRes, {
      'agents list is status 200': (r) => r.status === 200,
    });
    errorRate.add(!isListSuccess);

    if (isListSuccess) {
      const agents = JSON.parse(listRes.body as string).agents || [];
      
      if (agents.length > 0) {
        const agentId = agents[0].id;
        
        const getRes = http.get(`${API_BASE}/agents/${agentId}`, { headers });
        check(getRes, {
          'get agent is status 200': (r) => r.status === 200,
        });

        const start = Date.now();
        const chatRes = http.post(
          `${API_BASE}/agents/${agentId}/chat`,
          JSON.stringify({
            message: 'Hello, what can you help me with?',
            sessionId: `test-session-${Date.now()}`,
          }),
          { headers }
        );
        agentDuration.add(Date.now() - start);
        
        check(chatRes, {
          'chat response is status 200 or 202': (r) => r.status === 200 || r.status === 202,
        });
        errorRate.add(chatRes.status >= 400);
      }
    }

    sleep(1 + Math.random() * 2);
  });

  group('RAG Operations', () => {
    const start = Date.now();
    
    const queryRes = http.post(
      `${API_BASE}/rag/query`,
      JSON.stringify({
        query: 'What is the pricing for the platform?',
        topK: 5,
      }),
      { headers }
    );
    ragDuration.add(Date.now() - start);

    const isQuerySuccess = check(queryRes, {
      'rag query is status 200': (r) => r.status === 200,
      'rag query has results': (r) => {
        const body = JSON.parse(r.body as string);
        return body.results || body.answer;
      },
    });
    errorRate.add(!isQuerySuccess);

    const docsRes = http.get(`${API_BASE}/rag/documents`, { headers });
    check(docsRes, {
      'rag documents list is status 200': (r) => r.status === 200,
    });

    sleep(1 + Math.random());
  });

  group('Reminder Operations', () => {
    const start = Date.now();
    
    const createRes = http.post(
      `${API_BASE}/reminders`,
      JSON.stringify({
        title: `Test Reminder ${Date.now()}`,
        description: 'Load test reminder',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        type: 'one-time',
      }),
      { headers }
    );
    reminderDuration.add(Date.now() - start);

    const isCreateSuccess = check(createRes, {
      'create reminder is status 201': (r) => r.status === 201,
    });
    errorRate.add(!isCreateSuccess);

    if (isCreateSuccess) {
      const reminder = JSON.parse(createRes.body as string);
      
      const getRes = http.get(`${API_BASE}/reminders/${reminder.id}`, { headers });
      check(getRes, {
        'get reminder is status 200': (r) => r.status === 200,
      });

      const updateRes = http.patch(
        `${API_BASE}/reminders/${reminder.id}`,
        JSON.stringify({
          title: 'Updated Reminder',
        }),
        { headers }
      );
      check(updateRes, {
        'update reminder is status 200': (r) => r.status === 200,
      });

      http.del(`${API_BASE}/reminders/${reminder.id}`, null, { headers });
    }

    const listRes = http.get(`${API_BASE}/reminders`, { headers });
    check(listRes, {
      'list reminders is status 200': (r) => r.status === 200,
    });

    sleep(1 + Math.random());
  });

  group('Calendar Sync', () => {
    const calendarsRes = http.get(`${API_BASE}/calendar/calendars`, { headers });
    check(calendarsRes, {
      'calendars list is status 200': (r) => r.status === 200 || r.status === 404,
    });

    const eventsRes = http.get(`${API_BASE}/calendar/events`, { headers });
    check(eventsRes, {
      'events list is status 200': (r) => r.status === 200 || r.status === 404,
    });

    sleep(1 + Math.random());
  });

  group('Document Operations', () => {
    const docsRes = http.get(`${API_BASE}/documents`, { headers });
    check(docsRes, {
      'documents list is status 200': (r) => r.status === 200,
    });

    sleep(1 + Math.random());
  });

  group('WebSocket Simulation', () => {
    const wsRes = http.get(`${API_BASE}/ws/status`, { headers });
    check(wsRes, {
      'ws status is status 200': (r) => r.status === 200 || r.status === 404,
    });

    sleep(5 + Math.random() * 5);
  });

  sleep(2 + Math.random() * 3);
}

export function handleSummary(data: {
  metrics: Record<string, unknown>;
}) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data: { metrics: Record<string, unknown> }, opts: { indent?: string; enableColors?: boolean }) {
  const indent = opts.indent || '';
  const metrics = data.metrics;
  
  let output = `${indent}LOAD TEST SUMMARY\n`;
  output += `${indent}${'-'.repeat(50)}\n`;
  
  const httpMetrics = [
    'http_req_duration',
    'http_req_failed',
    'login_duration',
    'agent_duration',
    'rag_duration',
    'reminder_duration',
  ];
  
  for (const metric of httpMetrics) {
    if (metrics[metric]) {
      const m = metrics[metric] as { values?: Record<string, number> };
      const values = m.values || {};
      output += `${indent}${metric}:\n`;
      output += `${indent}  p95: ${values['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
      output += `${indent}  p99: ${values['p(99)']?.toFixed(2) || 'N/A'}ms\n`;
      output += `${indent}  avg: ${values['avg']?.toFixed(2) || 'N/A'}ms\n`;
    }
  }
  
  return output;
}
