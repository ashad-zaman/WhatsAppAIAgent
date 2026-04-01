import { Request, Response, NextFunction } from 'express';
import { verifyToken, AppError } from '@whatsapp-ai/common';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const result = verifyToken(token, process.env.JWT_SECRET || 'secret');

    if (!result.valid || !result.payload) {
      throw new AppError('Invalid or expired token', 401, 'TOKEN_ERROR');
    }

    const payload = result.payload as { sub: string; email: string; role?: string };
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const result = verifyToken(token, process.env.JWT_SECRET || 'secret');

    if (result.valid && result.payload) {
      const payload = result.payload as { sub: string; email: string; role?: string };
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role || '')) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

export default { authenticate, optionalAuth, requireRole };
