import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : undefined;

  logger.error('Request failed', {
    path: req.path,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(code ? { code } : {}),
  });
};
