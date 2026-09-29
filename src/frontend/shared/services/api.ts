import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage, STORAGE_KEYS } from './storage';
import { env } from '../config/env';

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(env.apiId ? { 'api-id': env.apiId, 'x-api-id': env.apiId } : {}),
  },
});

// Interceptor de Requisição: Injeta api-id, Bearer Token e X-Tenant-Id em todas as chamadas
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Injeta identificador de API se configurado
    if (env.apiId) {
      config.headers['api-id'] = env.apiId;
      config.headers['x-api-id'] = env.apiId;
    }

    const token = storage.getString(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

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
