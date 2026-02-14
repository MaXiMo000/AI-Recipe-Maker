import { Response } from 'express';

/**
 * Standardized API response helpers. All responses use a consistent shape:
 * success: { status, statusCode, message, data? }
 * error: { status, statusCode, message, errors? }
 * Backward compatibility: also send success: true/false for existing frontend.
 */

export function sendSuccess(
  res: Response,
  data: unknown = null,
  message: string = 'Success',
  statusCode: number = 200
): Response {
  const body: Record<string, unknown> = {
    status: 'success',
    success: true,
    statusCode,
    message,
  };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string = 'Internal Server Error',
  statusCode: number = 500,
  errors: unknown = null
): Response {
  const body: Record<string, unknown> = {
    status: 'error',
    success: false,
    statusCode,
    message,
    error: message, // backward compatibility
  };
  if (errors != null) {
    body.errors = errors;
    body.details = errors; // backward compatibility
  }
  return res.status(statusCode).json(body);
}

export function sendValidationError(
  res: Response,
  errors: unknown,
  message: string = 'Validation failed'
): Response {
  return sendError(res, message, 400, errors);
}

export function sendNotFound(res: Response, resource: string = 'Resource'): Response {
  return sendError(res, `${resource} not found`, 404);
}

export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized. Please authenticate.'
): Response {
  return sendError(res, message, 401);
}

export function sendForbidden(
  res: Response,
  message: string = "You don't have permission to perform this action."
): Response {
  return sendError(res, message, 403);
}

export function sendPaginated(
  res: Response,
  data: unknown[],
  pagination: { page: number; limit: number; total: number; totalPages?: number },
  message: string = 'Success'
): Response {
  const totalPages =
    pagination.totalPages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 10));
  return res.status(200).json({
    status: 'success',
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      total: pagination.total ?? 0,
      totalPages,
    },
  });
}

export function sendCreated(
  res: Response,
  data: unknown,
  message: string = 'Resource created successfully'
): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
