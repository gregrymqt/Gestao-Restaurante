import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueService } from '../services/estoqueService';
import { CadastrarInsumoInput, InsumoEstoque } from '../types';

export function useCadastrarInsumo() {
  const queryClient = useQueryClient();

  return useMutation<InsumoEstoque, Error, CadastrarInsumoInput & { signal?: AbortSignal }>({
    mutationFn: ({ signal, ...dados }) => estoqueService.cadastrarInsumo(dados, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
    },
  });
}
