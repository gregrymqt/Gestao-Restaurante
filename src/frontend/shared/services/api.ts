import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage, STORAGE_KEYS } from './storage';
import { env } from '../config/env';
import { useConnectionStore } from '../hooks/useConnectionStore';

let unauthorizedHandler: (() => void) | null = null;

/**
 * Registra callback desacoplado invocado quando a API retorna 401 (sessão expirada).
 */
export function registerUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Credenciais de sessão são enviadas apenas para chamadas autenticadas.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const path = config.url?.split('?')[0];
    if (path === '/auth/login' || path === '/auth/cadastrar-restaurante') {
      config.headers.delete('Authorization');
      config.headers.delete('X-Tenant-Id');
      return config;
    }

    const token = storage.getString(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      if (token.startsWith('mock-jwt-token')) {
        storage.delete(STORAGE_KEYS.AUTH_TOKEN);
        storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
        storage.delete(STORAGE_KEYS.ACTIVE_OPERATOR);
      } else {
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
      // Sessão expirada: limpa credenciais e notifica store para redirecionamento pelo Auth Guard
      storage.delete(STORAGE_KEYS.AUTH_TOKEN);
      storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
      storage.delete(STORAGE_KEYS.ACTIVE_OPERATOR);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

/**
 * Extrai de forma segura mensagens de erro vindas de respostas HTTP da API
 * ou exceções de rede/runtime, fornecendo uma mensagem amigável de fallback.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string; detail?: string; title?: string } } }).response;
    if (res?.data?.error) return res.data.error;
    if (res?.data?.detail) return res.data.detail;
    if (res?.data?.title) return res.data.title;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
