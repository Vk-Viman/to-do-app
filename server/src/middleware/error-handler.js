export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
}

export function errorHandler(err, _req, res, _next) {
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.issues
      }
    });
  }

  const status = err?.status || 500;
  const code = err?.code || 'INTERNAL_SERVER_ERROR';
  const message = err?.message || 'Something went wrong';

  if (status >= 500) {
    console.error(`[${code}]`, err);
  }

  const payload = { error: { code, message } };
  if (err?.details) payload.error.details = err.details;

  return res.status(status).json(payload);
}