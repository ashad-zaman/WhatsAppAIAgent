import { mocks, testUsers, testMessages, testTokens, testConfig } from './mocks';

export * from './mocks';
export * from './test-helpers';

export const mockData = {
  users: testUsers,
  messages: testMessages,
  tokens: testTokens,
  config: testConfig,
};

export const errorMessages = {
  unauthorized: 'Unauthorized access',
  forbidden: 'Access forbidden',
  notFound: 'Resource not found',
  validationError: 'Validation failed',
  serverError: 'Internal server error',
  rateLimitExceeded: 'Rate limit exceeded',
};

export const httpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
};

export { mocks };
