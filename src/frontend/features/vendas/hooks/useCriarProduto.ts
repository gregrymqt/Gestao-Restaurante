import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendasService } from '../services/vendasService';
import { CriarProdutoInput, Produto } from '../types';

export function useCriarProduto() {
  const queryClient = useQueryClient();

  return useMutation<Produto, Error, CriarProdutoInput & { signal?: AbortSignal }>({
    mutationFn: ({ signal, ...dto }) => vendasService.criarProduto(dto, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });
}
