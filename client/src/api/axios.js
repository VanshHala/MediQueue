import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[MediQueue] ⚠️ VITE_API_URL environment variable is not set! Defaulting to localhost:5000. Please configure VITE_API_URL in your Vercel project settings.'
  );
}
const baseURL = rawUrl.endsWith('/api')
  ? rawUrl
  : `${rawUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediqueue_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (localStorage.getItem('mediqueue_token')) {
        localStorage.removeItem('mediqueue_token');
        localStorage.removeItem('mediqueue_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
