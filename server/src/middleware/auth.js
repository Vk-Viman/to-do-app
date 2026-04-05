import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { ApiError } from './error-handler.js';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication token is required'));

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.id) return next(new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication token'));
    req.userId = payload.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Session expired. Please sign in again'));
    }
    return next(new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication token'));
  }
}
