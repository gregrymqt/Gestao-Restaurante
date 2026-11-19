import { create } from 'zustand';
import { storage } from '@/shared/services/storage';

const STORAGE_KEY = 'kds_checklist_itens_marcados';

interface KdsChecklistState {
  itensMarcados: Record<string, boolean>;
  isMarcado: (itemId: string) => boolean;
  toggleItem: (itemId: string) => void;
  limparItens: (itemIds: readonly string[]) => void;
  limparTudo: () => void;
}

function carregarItensIniciais(): Record<string, boolean> {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, boolean>;
      }
    }
  } catch {
    // fallback silencioso
  }
  return {};
}

function persistirItens(itens: Record<string, boolean>): void {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(itens));
  } catch {
    // fallback silencioso
  }
}

export const useKdsChecklistStore = create<KdsChecklistState>((set, get) => ({
  itensMarcados: carregarItensIniciais(),

  isMarcado: (itemId: string) => Boolean(get().itensMarcados[itemId]),

  toggleItem: (itemId: string) => {
    set((state) => {
      const proximo = { ...state.itensMarcados };
      if (proximo[itemId]) {
        delete proximo[itemId];
      } else {
        proximo[itemId] = true;
      }
      persistirItens(proximo);
      return { itensMarcados: proximo };
    });
  },

  limparItens: (itemIds: readonly string[]) => {
    set((state) => {
      const proximo = { ...state.itensMarcados };
      let mudou = false;
      for (const id of itemIds) {
        if (proximo[id]) {
          delete proximo[id];
          mudou = true;
        }
      }
      if (mudou) {
        persistirItens(proximo);
        return { itensMarcados: proximo };
      }
      return state;
    });
  },

  limparTudo: () => {
    persistirItens({});
    set({ itensMarcados: {} });
  },
}));

export function useKdsChecklist() {
  const itensMarcados = useKdsChecklistStore((s) => s.itensMarcados);
  const toggleItem = useKdsChecklistStore((s) => s.toggleItem);
  const limparItens = useKdsChecklistStore((s) => s.limparItens);

  return {
    itensMarcados,
    isItemMarcado: (itemId: string) => Boolean(itensMarcados[itemId]),
    toggleItem,
    limparItens,
  };
}
