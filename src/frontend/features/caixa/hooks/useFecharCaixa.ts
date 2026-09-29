import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDialog } from '@/shared/components/AppDialog';
import { caixaService } from '../services/caixaService';
import { FecharCaixaResponseDto } from '../types';

interface UseFecharCaixaOptions {
  onSuccessCallback?: (data: FecharCaixaResponseDto) => void;
}

export function useFecharCaixa(options?: UseFecharCaixaOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => caixaService.fecharCaixa(),
    onSuccess: (data: FecharCaixaResponseDto) => {
      // 1. Invalida os caches do caixa e previsões
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['previsoes'] });

      // 2. Executa callback opcional (fechar modal)
      if (options?.onSuccessCallback) {
        options.onSuccessCallback(data);
      }

      // 3. Alerta de sucesso com feedback do RabbitMQ e IA
      AppDialog.success(
        'Caixa Encerrado com Sucesso! 🔒',
        `Fechamento ID: #${data.fechamentoCaixaId}\nTotal Consolidado: R$ ${data.valorTotalVendas.toFixed(2).replace('.', ',')}\nVendas: ${data.quantidadeVendas} transações\n\n🤖 Evento publicado no RabbitMQ! O pipeline de Machine Learning iniciou o cálculo preditivo para o próximo turno.`
      );
    },
    onError: (error: Error) => {
      AppDialog.error(
        'Erro ao Encerrar Caixa',
        error.message || 'Não foi possível encerrar a sessão do caixa. Tente novamente.'
      );
    },
  });
}
