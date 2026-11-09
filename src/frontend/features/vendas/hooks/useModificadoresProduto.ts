import { useQuery } from '@tanstack/react-query';
import { vendasService } from '../services/vendasService';
import { GrupoModificador } from '../types';

export function useModificadoresProduto(produtoId: string | null | undefined) {
  return useQuery<GrupoModificador[]>({
    queryKey: ['produtos', produtoId, 'modificadores'],
    queryFn: () => {
      if (!produtoId) return Promise.resolve([]);
      return vendasService.obterModificadoresProduto(produtoId);
    },
    enabled: Boolean(produtoId),
    staleTime: 5 * 60 * 1000, // 5 minutos de cache em memória
  });
}
