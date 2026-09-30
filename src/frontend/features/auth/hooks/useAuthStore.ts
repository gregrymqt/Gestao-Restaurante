import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/shared/services/storage';
import { AuthState, RestauranteTenant, OperadorRecente } from '../types';
import { TENANTS_PADRAO } from '../services/authService';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  tenant: TENANTS_PADRAO[0],
  operador: null,
  isAuthenticated: false,
  isInitialized: false,

  setSession: ({ token, refreshToken, tenant, operador }) => {
    storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    storage.set(STORAGE_KEYS.ACTIVE_TENANT, JSON.stringify(tenant));
    storage.set(STORAGE_KEYS.ACTIVE_OPERATOR, JSON.stringify(operador));

    set({
      token,
      refreshToken,
      tenant,
      operador,
      isAuthenticated: true,
      isInitialized: true,
    });
  },

  setTenant: (tenant: RestauranteTenant) => {
    storage.set(STORAGE_KEYS.ACTIVE_TENANT, JSON.stringify(tenant));
    set({ tenant });
  },

  logout: () => {
    storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
    storage.delete(STORAGE_KEYS.ACTIVE_OPERATOR);

    set({
      token: null,
      refreshToken: null,
      operador: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },

  initSessionFromStorage: () => {
    try {
      const token = storage.getString(STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN);

      // Auto-purga inteligente de tokens mock / legados para exigir autenticação real
      if (token?.startsWith('mock-jwt-token') || refreshToken?.startsWith('mock-refresh-token')) {
        console.warn('[Auth] Token de simulação (mock) detectado no storage. Purgando sessão para exigir autenticação real...');
        storage.delete(STORAGE_KEYS.AUTH_TOKEN);
        storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
        storage.delete(STORAGE_KEYS.ACTIVE_OPERATOR);
        set({
          token: null,
          refreshToken: null,
          operador: null,
          isAuthenticated: false,
          isInitialized: true,
        });
        return;
      }

      const tenantRaw = storage.getString(STORAGE_KEYS.ACTIVE_TENANT);
      const operadorRaw = storage.getString(STORAGE_KEYS.ACTIVE_OPERATOR);

      let tenant: RestauranteTenant = TENANTS_PADRAO[0];
      if (tenantRaw) {
        tenant = JSON.parse(tenantRaw);
      }

      let operador: OperadorRecente | null = null;
      if (operadorRaw) {
        operador = JSON.parse(operadorRaw);
      }

      const isAuthenticated = !!token && !!operador;

      set({
        token,
        refreshToken,
        tenant,
        operador,
        isAuthenticated,
        isInitialized: true,
      });
    } catch {
      set({
        token: null,
        refreshToken: null,
        tenant: TENANTS_PADRAO[0],
        operador: null,
        isAuthenticated: false,
        isInitialized: true,
      });
    }
  },
}));
