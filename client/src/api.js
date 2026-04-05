import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const baseURL = rawBaseUrl.replace(/\/$/, '');

const api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true
});

const getCookieValue = (name) => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

let csrfBootstrapPromise = null;

const ensureCsrfToken = async () => {
  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = api.get('/csrf-token')
      .catch(() => null)
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }
  await csrfBootstrapPromise;
};

const shouldRefreshToken = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.error?.code;
  return status === 401 && (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || code === 'AUTH_REQUIRED');
};

const isAuthRoute = (url = '') => {
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh') || url.includes('/auth/logout');
};

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = String(config.method || 'get').toLowerCase();
  const isUnsafeMethod = ['post', 'put', 'patch', 'delete'].includes(method);
  if (isUnsafeMethod) {
    await ensureCsrfToken();
    const csrfToken = getCookieValue('csrfToken');
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) throw error;

    if (!shouldRefreshToken(error) || originalRequest._retry || isAuthRoute(originalRequest.url)) {
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = api.post('/auth/refresh')
        .then(({ data }) => {
          localStorage.setItem('token', data.token);
          return data.token;
        })
        .catch((refreshError) => {
          localStorage.removeItem('token');
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newAccessToken = await refreshPromise;
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  }
);

export default api;
