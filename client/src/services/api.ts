import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Normalize baseURL so it always points to the Express /api mount
const rawEnvUrl = (import.meta as any).env?.VITE_API_BASE_URL;
let baseURL = 'https://tmq-authenticity-api.onrender.com/api';

if (rawEnvUrl) {
  const trimmed = rawEnvUrl.replace(/\/+$/, '');
  baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/* ---- Request interceptor: attach access token ---- */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('tmq_token') || localStorage.getItem('tmq_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---- Response interceptor: auto-redirect on unauthorized ---- */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('tmq_token');
      localStorage.removeItem('tmq_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
