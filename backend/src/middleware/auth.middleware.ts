import type { NextFunction, Request, Response } from 'express';
import type { RequestBusinessContext, RequestUserContext } from '../express.d';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { verifyToken } from '../config/firebase';
import { logger } from '../config/logger';

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return token.length ? token : null;
};

const getStringClaim = (claims: Record<string, unknown>, key: string) => {
  const value = claims[key];
  return typeof value === 'string' && value.trim().length ? value : undefined;
};

const attachAuthContext = (req: Request, decoded: DecodedIdToken) => {
  const claims = decoded as Record<string, unknown>;

  req.user = {
    id: decoded.uid,
    role: getStringClaim(claims, 'role'),
    firebaseClaims: claims,
  };

  // Validation: Business ID is required
  const businessId = getStringClaim(claims, 'businessId');
  if (!businessId) {
    throw new Error('Business ID required for this application');
  }

  req.business = {
    id: businessId,
    name: getStringClaim(claims, 'businessName') ?? decoded.name ?? decoded.email ?? 'Business',
    plan: getStringClaim(claims, 'plan') ?? 'starter',
  };
};

const attachAuthContextWithoutBusiness = (req: Request, decoded: DecodedIdToken) => {
  const claims = decoded as Record<string, unknown>;

  req.user = {
    id: decoded.uid,
    role: getStringClaim(claims, 'role'),
    firebaseClaims: claims,
  };

  // Optional: set business context if available, but don't require it
  const businessId = getStringClaim(claims, 'businessId');
  if (businessId && businessId !== decoded.uid) {
    req.business = {
      id: businessId,
      name: getStringClaim(claims, 'businessName') ?? decoded.name ?? decoded.email ?? 'Business',
      plan: getStringClaim(claims, 'plan') ?? 'starter',
    };
  }
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'No token provided. Include Authorization: Bearer <token>' });
    return;
  }

  try {
    const decoded = await verifyToken(token);
    attachAuthContext(req, decoded);

    logger.debug('Request authenticated', {
      uid: decoded.uid,
      path: req.path,
    });

    next();
  } catch (err: any) {
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 401;

    logger.warn('Authentication failed', {
      path: req.path,
      message: err.message,
      code: err.code,
    });

    res.status(statusCode).json({
      error: err.message || 'Authentication failed.',
      ...(err.code ? { code: err.code } : {}),
    });
  }
};

export const authenticateWithoutBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'No token provided. Include Authorization: Bearer <token>' });
    return;
  }

  try {
    const decoded = await verifyToken(token);
    attachAuthContextWithoutBusiness(req, decoded);

    logger.debug('Request authenticated (no business required)', {
      uid: decoded.uid,
      path: req.path,
    });

    next();
  } catch (err: any) {
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 401;

    logger.warn('Authentication failed', {
      path: req.path,
      message: err.message,
      code: err.code,
    });

    res.status(statusCode).json({
      error: err.message || 'Authentication failed.',
      ...(err.code ? { code: err.code } : {}),
    });
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = await verifyToken(token);
    attachAuthContext(req, decoded);
  } catch (err: any) {
    logger.warn('Optional authentication ignored', {
      path: req.path,
      message: err.message,
      code: err.code,
    });
  }

  next();
};

export const attachBusinessContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.business) {
    res.status(401).json({
      error: 'Business context is missing from the authenticated request.',
      code: 'BUSINESS_CONTEXT_MISSING',
    });
    return;
  }

  next();
};

export const requireRole = (roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const currentRole = req.user?.role;

    if (!currentRole || !roles.includes(currentRole)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE',
      });
      return;
    }

    next();
  };
