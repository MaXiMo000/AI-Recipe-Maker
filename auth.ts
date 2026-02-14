import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './environment';
import { logger } from './logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header or cookie
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token
    jwt.verify(token, config.jwtSecret, (err: Error | null, decoded: unknown) => {
      if (err) {
        logger.warn('Invalid token attempt', { error: err.message });
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = decoded as { id: string; email: string };
      next();
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1] || req.cookies?.accessToken;

  if (!token) {
    next();
    return;
  }

  jwt.verify(token, config.jwtSecret, (err: Error | null, decoded: unknown) => {
    if (!err && decoded) {
      req.user = decoded as { id: string; email: string };
    }
    next();
  });
};

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { id: userId, email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry } as jwt.SignOptions
  );
};
