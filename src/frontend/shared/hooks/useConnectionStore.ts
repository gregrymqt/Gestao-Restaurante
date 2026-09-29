import { create } from 'zustand';
import axios from 'axios';
import { env } from '../config/env';

interface ConnectionState {
  isApiOnline: boolean;
  isChecking: boolean;
  lastChecked: number | null;
  lastErrorMessage: string | null;
  setApiOnline: (online: boolean, errorMessage?: string) => void;
  checkConnection: () => Promise<boolean>;
}

let autoReconnectTimer: ReturnType<typeof setInterval> | null = null;

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isApiOnline: true,
  isChecking: false,
  lastChecked: null,
  lastErrorMessage: null,

  setApiOnline: (online: boolean, errorMessage?: string) => {
    set({
      isApiOnline: online,
      lastChecked: Date.now(),
      lastErrorMessage: online ? null : errorMessage || 'Servidor inacessível no momento',
    });

    if (!online && !autoReconnectTimer) {
      // Inicia polling leve em background a cada 15 segundos para auto-recuperação
      autoReconnectTimer = setInterval(() => {
        get().checkConnection();
      }, 15000);
    } else if (online && autoReconnectTimer) {
      clearInterval(autoReconnectTimer);
      autoReconnectTimer = null;
    }
  },

  checkConnection: async () => {
    if (get().isChecking) return get().isApiOnline;

    set({ isChecking: true });
    try {
      const response = await axios.get(`${env.apiUrl}/health`, {
        timeout: 5000,
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Accept: 'application/json',
        },
      });

      if (response.status >= 200 && response.status < 300) {
        get().setApiOnline(true);
        set({ isChecking: false, lastChecked: Date.now() });
        return true;
      }

      get().setApiOnline(false, `Status HTTP ${response.status}`);
      set({ isChecking: false, lastChecked: Date.now() });
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na sondagem de rede';
      get().setApiOnline(false, msg);
      set({ isChecking: false, lastChecked: Date.now() });
      return false;
    }
  },
}));
