import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendasService } from '../services/vendasService';
import { CriarProdutoInput, Produto } from '../types';

export function useCriarProduto() {
  const queryClient = useQueryClient();

  return useMutation<Produto, Error, CriarProdutoInput>({
    mutationFn: (dto) => vendasService.criarProduto(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });
}
