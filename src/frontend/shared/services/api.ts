import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage, STORAGE_KEYS } from './storage';

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor de Requisição: Injeta Bearer Token e X-Tenant-Id em todas as chamadas
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getString(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantRaw = storage.getString(STORAGE_KEYS.ACTIVE_TENANT);
    if (tenantRaw) {
      try {
        const tenant = JSON.parse(tenantRaw);
        if (tenant?.id) {
          config.headers['X-Tenant-Id'] = tenant.id;
        }
      } catch {
        // Ignora parsing inválido
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Trata expiração e 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sessão expirada: limpa credenciais para redirecionamento pelo Auth Guard
      storage.delete(STORAGE_KEYS.AUTH_TOKEN);
      storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return Promise.reject(error);
  }
);
