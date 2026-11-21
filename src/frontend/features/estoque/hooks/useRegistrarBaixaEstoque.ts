import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueService } from '../services/estoqueService';
import { BaixaEstoqueInput } from '../types';

export function useRegistrarBaixaEstoque() {
  const queryClient = useQueryClient();

  return useMutation<{ status: string }, Error, BaixaEstoqueInput & { signal?: AbortSignal }>({
    mutationFn: ({ signal, ...dados }) => estoqueService.registrarBaixaEstoque(dados, signal),
    onSuccess: () => {
      // Invalida e atualiza imediatamente a visão materializada do estoque e as projeções
      queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
    },
  });
}
