import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueService } from '../services/estoqueService';
import { EntradaEstoqueInput, EntradaEstoqueResponse } from '../types';

export function useRegistrarEntradaEstoque() {
  const queryClient = useQueryClient();

  return useMutation<EntradaEstoqueResponse, Error, EntradaEstoqueInput>({
    mutationFn: (entrada) => estoqueService.registrarEntradaEstoque(entrada),
    onSuccess: () => {
      // Invalida e atualiza imediatamente a visão materializada do estoque e as projeções
      queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
    },
  });
}
