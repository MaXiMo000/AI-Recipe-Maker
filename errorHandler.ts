import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { sendError, sendNotFound } from './responseHelper';
import { z } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Zod validation errors
  else if (err instanceof z.ZodError) {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle database errors
  else if (err.message?.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  }
  else if (err.message?.includes('foreign key')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
  }

  // Log with request context (no secrets: no body, no full headers)
  const requestContext = {
    method: req.method,
    url: req.url,
    userId: (req as Request & { user?: { id: string } }).user?.id,
  };
  if (statusCode >= 500) {
    logger.error('Server error:', {
      name: err.name,
      message: err.message,
      statusCode,
      ...requestContext,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  } else {
    logger.warn('Client error:', {
      name: err.name,
      message: err.message,
      statusCode,
      ...requestContext,
    });
  }

  // In production, hide internal details for 500 errors
  const safeMessage =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Something went wrong'
      : message;

  sendError(res, safeMessage, statusCode, details ?? undefined);
};

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response) => {
  sendNotFound(res, `Route ${req.originalUrl}`);
};
