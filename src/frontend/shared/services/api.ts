import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage, STORAGE_KEYS } from './storage';
import { env } from '../config/env';
import { useConnectionStore } from '../hooks/useConnectionStore';

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

// Interceptor de Resposta: Trata recuperação de conexão, expiração de sessão e quedas da API
apiClient.interceptors.response.use(
  (response) => {
    // Se a conexão estava marcada como offline, qualquer resposta válida restabelece o estado
    if (!useConnectionStore.getState().isApiOnline) {
      useConnectionStore.getState().setApiOnline(true);
    }
    return response;
  },
  (error) => {
    // Detecta indisponibilidade da API: falhas de rede, timeouts, CORS ou erros 502/503/504
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error';

    const isServerError = error.response?.status >= 502 && error.response?.status <= 504;

    if (isNetworkError || isServerError) {
      useConnectionStore.getState().setApiOnline(false, error.message || 'Servidor indisponível');
    }

    if (error.response?.status === 401) {
      // Sessão expirada: limpa credenciais para redirecionamento pelo Auth Guard
      storage.delete(STORAGE_KEYS.AUTH_TOKEN);
      storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return Promise.reject(error);
  }
);
