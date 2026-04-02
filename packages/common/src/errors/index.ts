export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.retryAfter = retryAfter;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`Service '${service}' is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(`External service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
      originalError: originalError?.message,
    });
    this.service = service;
    this.originalError = originalError;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class TokenError extends AppError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 401, 'TOKEN_ERROR');
  }
}

export class QuotaExceededError extends AppError {
  public readonly quotaType: string;
  public readonly currentUsage: number;
  public readonly limit: number;

  constructor(quotaType: string, currentUsage: number, limit: number) {
    super(`Quota exceeded for ${quotaType}`, 402, 'QUOTA_EXCEEDED', {
      quotaType,
      currentUsage,
      limit,
    });
    this.quotaType = quotaType;
    this.currentUsage = currentUsage;
    this.limit = limit;
  }
}

export class WorkflowExecutionError extends AppError {
  public readonly workflowId: string;
  public readonly stepId: string;

  constructor(workflowId: string, stepId: string, message: string) {
    super(`Workflow execution failed: ${message}`, 500, 'WORKFLOW_EXECUTION_ERROR', {
      workflowId,
      stepId,
    });
    this.workflowId = workflowId;
    this.stepId = stepId;
  }
}

export class AgentExecutionError extends AppError {
  public readonly agentId: string;
  public readonly agentType: string;

  constructor(agentId: string, agentType: string, message: string) {
    super(`Agent execution failed: ${message}`, 500, 'AGENT_EXECUTION_ERROR', {
      agentId,
      agentType,
    });
    this.agentId = agentId;
    this.agentType = agentType;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_ERROR');
  }

  return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
}
