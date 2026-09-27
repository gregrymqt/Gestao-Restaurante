import { useQuery } from '@tanstack/react-query';
import { caixaService, DADOS_SESSAO_PADRAO } from '../services/caixaService';
import { SessaoCaixaResumo } from '../types';

export function useCaixaAtual() {
  const {
    data: sessao = DADOS_SESSAO_PADRAO,
    isLoading,
    isError,
    refetch,
  } = useQuery<SessaoCaixaResumo>({
    queryKey: ['caixa', 'sessao-ativa'],
    queryFn: () => caixaService.obterSessaoAtiva(),
    staleTime: 1000 * 60 * 2, // 2 minutos de cache
  });

  return {
    sessao,
    isLoading,
    isError,
    refetch,
  };
}
