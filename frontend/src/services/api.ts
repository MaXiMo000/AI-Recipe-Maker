import axios from 'axios';

// Backend mounts routes at /api/auth, /api/recipes, etc. Ensure baseURL always ends with /api.
const apiOrigin = import.meta.env.VITE_API_URL || '';
const baseURL = apiOrigin ? `${apiOrigin.replace(/\/+$/, '')}/api` : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);
