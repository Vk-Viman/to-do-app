import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { JWT_EXPIRES_IN, JWT_SECRET, NODE_ENV, REFRESH_TOKEN_TTL_DAYS } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ApiError } from '../middleware/error-handler.js';

const router = express.Router();

const authBodySchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72)
});

const REFRESH_TOKEN_COOKIE = 'refreshToken';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function refreshTokenExpiryDate() {
  const now = Date.now();
  return new Date(now + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };
}

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function issueRefreshToken(userId, ip, replacedByHash = null) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = refreshTokenExpiryDate();

  await RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt,
    createdByIp: ip,
    replacedByHash
  });

  return refreshToken;
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_TOKEN_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...refreshCookieOptions(),
    maxAge: undefined
  });
}

router.post('/register', validate(authBodySchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'EMAIL_IN_USE', 'Email already in use');

  const user = await User.create({ email, password });
  const token = signToken(user._id);
  const refreshToken = await issueRefreshToken(user._id, req.ip);
  setRefreshCookie(res, refreshToken);

  res.status(201).json({ token, user: { id: user._id, email: user.email } });
}));

router.post('/login', validate(authBodySchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = signToken(user._id);
  const refreshToken = await issueRefreshToken(user._id, req.ip);
  setRefreshCookie(res, refreshToken);
  res.json({ token, user: { id: user._id, email: user.email } });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (!rawRefreshToken) throw new ApiError(401, 'REFRESH_TOKEN_MISSING', 'Refresh token is required');

  const oldTokenHash = hashToken(rawRefreshToken);
  const existingToken = await RefreshToken.findOne({ tokenHash: oldTokenHash });
  if (!existingToken) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');

  if (existingToken.revokedAt) {
    throw new ApiError(401, 'REFRESH_TOKEN_REVOKED', 'Refresh token has been revoked');
  }

  if (existingToken.expiresAt <= new Date()) {
    existingToken.revokedAt = new Date();
    existingToken.revokedByIp = req.ip;
    await existingToken.save();
    throw new ApiError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
  }

  const user = await User.findById(existingToken.user).select('_id email');
  if (!user) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = refreshTokenExpiryDate();

  existingToken.revokedAt = new Date();
  existingToken.revokedByIp = req.ip;
  existingToken.replacedByHash = newTokenHash;
  await existingToken.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
    createdByIp: req.ip
  });

  setRefreshCookie(res, newRefreshToken);
  const token = signToken(user._id);

  res.json({ token, user: { id: user._id, email: user.email } });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const tokenDoc = await RefreshToken.findOne({ tokenHash });
    if (tokenDoc && !tokenDoc.revokedAt) {
      tokenDoc.revokedAt = new Date();
      tokenDoc.revokedByIp = req.ip;
      await tokenDoc.save();
    }
  }

  clearRefreshCookie(res);
  res.json({ ok: true });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('_id email');
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  res.json({ user });
}));

export default router;
