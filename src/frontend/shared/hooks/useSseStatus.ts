import { create } from 'zustand';
import { SseConnectionState, RealtimeToastNotice } from '../types/sse.types';

interface SseStatusState {
  status: SseConnectionState;
  lastEventTimestamp: string | null;
  activeToast: RealtimeToastNotice | null;
  setStatus: (status: SseConnectionState) => void;
  setLastEventTimestamp: (timestamp: string) => void;
  showToast: (toast: Omit<RealtimeToastNotice, 'id' | 'dataHora'>) => void;
  clearToast: () => void;
}

export const useSseStatus = create<SseStatusState>((set) => ({
  status: 'DISCONNECTED',
  lastEventTimestamp: null,
  activeToast: null,

  setStatus: (status) => set({ status }),

  setLastEventTimestamp: (timestamp) => set({ lastEventTimestamp: timestamp }),

  showToast: (toast) => {
    const notice: RealtimeToastNotice = {
      ...toast,
      id: `toast-${Date.now().toString(36)}`,
      dataHora: new Date().toISOString(),
    };
    set({ activeToast: notice });
  },

  clearToast: () => set({ activeToast: null }),
}));
