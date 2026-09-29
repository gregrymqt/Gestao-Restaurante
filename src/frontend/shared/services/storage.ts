import type { MMKV } from 'react-native-mmkv';

// Criação da instância síncrona segura com isolamento de chave
let mmkvInstance: MMKV | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv');
  mmkvInstance = createMMKV({
    id: 'gastropdv-secure-storage',
  });
} catch {
  // Fallback silencioso para ambientes onde JSI/NitroModules não está ativo (ex: Expo Go, node tests, web)
  mmkvInstance = null;
}

// Mapa em memória para fallback resiliente quando MMKV nativo não estiver disponível
const memoryStorage = new Map<string, string>();

export const storage = {
  getString(key: string): string | null {
    if (mmkvInstance) {
      return mmkvInstance.getString(key) ?? null;
    }
    return memoryStorage.get(key) ?? null;
  },

  set(key: string, value: string): void {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
    } else {
      memoryStorage.set(key, value);
    }
  },

  delete(key: string): void {
    if (mmkvInstance) {
      mmkvInstance.remove(key);
    } else {
      memoryStorage.delete(key);
    }
  },

  clearAll(): void {
    if (mmkvInstance) {
      mmkvInstance.clearAll();
    } else {
      memoryStorage.clear();
    }
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  ACTIVE_TENANT: 'auth_active_tenant',
  ACTIVE_OPERATOR: 'auth_active_operator',
} as const;
