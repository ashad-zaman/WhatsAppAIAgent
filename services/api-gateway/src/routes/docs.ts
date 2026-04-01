import { Router, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

router.get('/', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Agent Platform API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      font-size: 36px;
      color: #3b82f6;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        oauth2RedirectUrl: window.location.origin + '/api/docs/oauth2-redirect.html',
        requestInterceptor: function(request) {
          var token = localStorage.getItem('auth_token');
          if (token) {
            request.headers['Authorization'] = 'Bearer ' + token;
          }
          return request;
        }
      });
    };
  </script>
</body>
</html>
  `);
});

router.get('/swagger.json', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../swagger.json'));
});

router.get('/oauth2-redirect.html', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>OAuth2 Redirect</title>
</head>
<body>
  <script>
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (window.opener) {
      window.opener.postMessage({ code, state }, window.location.origin);
    }
    window.close();
  </script>
</body>
</html>
  `);
});

router.get('/postman', (req: Request, res: Response) => {
  const postmanCollection = {
    info: {
      name: "WhatsApp AI Agent Platform API",
      description: "Production-grade SaaS WhatsApp AI Agent Platform with Multi-Agent & Graph RAG architecture",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      {
        key: "baseUrl",
        value: "{{baseUrl}}"
      }
    ],
    auth: {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{token}}",
          type: "string"
        }
      ]
    },
    item: [
      {
        name: "Auth",
        item: [
          {
            name: "Register",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "user@example.com",
                  password: "password123",
                  fullName: "John Doe",
                  phone: "+1234567890"
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/auth/register", host: ["{{baseUrl}}"], path: ["api", "auth", "register"] }
            }
          },
          {
            name: "Login",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "user@example.com",
                  password: "password123"
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/auth/login", host: ["{{baseUrl}}"], path: ["api", "auth", "login"] }
            }
          },
          {
            name: "Get Current User",
            request: {
              method: "GET",
              header: [],
              url: { raw: "{{baseUrl}}/api/auth/me", host: ["{{baseUrl}}"], path: ["api", "auth", "me"] }
            }
          }
        ]
      },
      {
        name: "Agents",
        item: [
          {
            name: "List Agents",
            request: {
              method: "GET",
              header: [],
              url: { raw: "{{baseUrl}}/api/agents", host: ["{{baseUrl}}"], path: ["api", "agents"] }
            }
          },
          {
            name: "Create Agent",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  name: "My Reminder Agent",
                  type: "reminder",
                  config: {
                    model: "gpt-4",
                    temperature: 0.7,
                    maxTokens: 1000
                  },
                  systemPrompt: "You are a helpful reminder assistant."
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/agents", host: ["{{baseUrl}}"], path: ["api", "agents"] }
            }
          }
        ]
      },
      {
        name: "Reminders",
        item: [
          {
            name: "List Reminders",
            request: {
              method: "GET",
              header: [],
              url: { raw: "{{baseUrl}}/api/reminders", host: ["{{baseUrl}}"], path: ["api", "reminders"] }
            }
          },
          {
            name: "Create Reminder",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  title: "Meeting with team",
                  description: "Weekly standup meeting",
                  scheduledAt: "2024-12-20T10:00:00Z",
                  timezone: "UTC",
                  repeatType: "weekly",
                  repeatInterval: 1
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/reminders", host: ["{{baseUrl}}"], path: ["api", "reminders"] }
            }
          }
        ]
      },
      {
        name: "Documents",
        item: [
          {
            name: "Search Documents",
            request: {
              method: "GET",
              header: [],
              url: { raw: "{{baseUrl}}/api/documents/search?q=meeting notes", host: ["{{baseUrl}}"], path: ["api", "documents", "search"] }
            }
          },
          {
            name: "Upload Document",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  title: "Q4 Report",
                  fileType: "pdf",
                  fileSize: 1024000
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/documents/upload", host: ["{{baseUrl}}"], path: ["api", "documents", "upload"] }
            }
          }
        ]
      },
      {
        name: "RAG",
        item: [
          {
            name: "Query Knowledge Base",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  query: "What are the product features?",
                  topK: 5
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/rag/query", host: ["{{baseUrl}}"], path: ["api", "rag", "query"] }
            }
          }
        ]
      },
      {
        name: "Billing",
        item: [
          {
            name: "Get Plans",
            request: {
              method: "GET",
              header: [],
              url: { raw: "{{baseUrl}}/api/billing/plans", host: ["{{baseUrl}}"], path: ["api", "billing", "plans"] }
            }
          },
          {
            name: "Subscribe",
            request: {
              method: "POST",
              header: [],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  planId: "pro"
                }, null, 2),
                options: { raw: { language: "json" } }
              },
              url: { raw: "{{baseUrl}}/api/billing/subscribe", host: ["{{baseUrl}}"], path: ["api", "billing", "subscribe"] }
            }
          }
        ]
      }
    ]
  };

  res.json(postmanCollection);
});

export { router };
