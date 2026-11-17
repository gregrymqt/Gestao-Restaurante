import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AppDialog } from '@/shared/components/AppDialog';
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

export function useAbrirCaixa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: caixaService.abrirCaixa,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['caixa'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
    onError: (error: unknown) => {
      const mensagem = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      AppDialog.error('Erro ao abrir caixa', mensagem || 'Não foi possível abrir o caixa. Tente novamente.');
    },
  });
}
