import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import lusca from 'lusca';
import { CLIENT_ORIGIN, MONGODB_URI, NODE_ENV, PORT, TRUST_PROXY } from './config.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { ApiError, errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();

// Trust the first proxy hop when TRUST_PROXY is set so that req.ip reflects
// the real client IP for rate-limiting and audit logs.
if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);

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

const secureCookie = NODE_ENV === 'production';
const csrfProtection = lusca.csrf({
  cookie: {
    key: '_csrf',
    path: '/api',
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax'
  }
});

app.get('/', (_req, res) => res.send('API OK'));
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  const token = req.csrfToken();
  res.cookie('csrfToken', token, {
    path: '/api',
    httpOnly: false,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax'
  });
  res.json({ csrfToken: token });
});
app.use('/api/auth', csrfProtection);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', csrfProtection);
app.use('/api/tasks', taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Mongo connection error:', err.message); process.exit(1); });
