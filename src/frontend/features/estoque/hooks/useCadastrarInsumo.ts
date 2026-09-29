import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueService } from '../services/estoqueService';
import { CadastrarInsumoInput, InsumoEstoque } from '../types';

export function useCadastrarInsumo() {
  const queryClient = useQueryClient();

  return useMutation<InsumoEstoque, Error, CadastrarInsumoInput>({
    mutationFn: (dados) => estoqueService.cadastrarInsumo(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
    },
  });
}
