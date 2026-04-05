import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 4000;
// Set TRUST_PROXY to '1' (or a specific hop count/IP) when running behind a
// reverse proxy or load balancer so that req.ip reflects the real client IP.
export const TRUST_PROXY = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? '1' : false);
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 14;

export const MONGODB_URI = requireEnv('MONGODB_URI');
export const JWT_SECRET = requireEnv('JWT_SECRET');
