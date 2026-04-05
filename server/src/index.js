import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { CLIENT_ORIGIN, MONGODB_URI, NODE_ENV, PORT } from './config.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { ApiError, errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin === CLIENT_ORIGIN) return callback(null, true);
    return callback(new ApiError(403, 'CORS_ORIGIN_DENIED', 'CORS origin is not allowed'));
  },
  credentials: true
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false
});

app.disable('x-powered-by');
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/api', apiLimiter);

app.use('/api/auth', (req, _res, next) => {
  const isUnsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!isUnsafeMethod) return next();

  const hasRefreshTokenCookie = Boolean(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  if (!hasRefreshTokenCookie) return next();

  const origin = req.get('origin');
  if (origin && origin !== CLIENT_ORIGIN) {
    return next(new ApiError(403, 'CSRF_ORIGIN_DENIED', 'Request origin is not allowed'));
  }

  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.get('x-csrf-token');
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new ApiError(403, 'CSRF_TOKEN_INVALID', 'CSRF token is missing or invalid'));
  }

  return next();
});

app.get('/', (_req, res) => res.send('API OK'));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Mongo connection error:', err.message); process.exit(1); });
