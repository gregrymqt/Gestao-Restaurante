import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isCancel } from '@/services/api';
import { perfilService } from '@/features/perfil/services/perfilService';
import { AppDialog } from '@/shared/components/AppDialog';

export interface RegistrarMovimentacaoParams {
  tipo: 'SUPRIMENTO' | 'SANGRIA';
  valor: number;
  motivo?: string;
  signal?: AbortSignal;
}

export function useMovimentacaoCaixa(saldoDinheiro: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: RegistrarMovimentacaoParams) =>
      perfilService.registrarMovimentacao(
        {
          tipo: dados.tipo,
          valor: dados.valor,
          motivo: dados.motivo || (dados.tipo === 'SUPRIMENTO' ? 'Suprimento de troco' : 'Sangria de caixa'),
        },
        saldoDinheiro,
        dados.signal
      ),
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: ['caixa'] });
      AppDialog.success('Movimentação Registrada', resultado.mensagem);
    },
    onError: (err: unknown) => {
      if (isCancel(err)) return;
      AppDialog.error('Erro', 'Não foi possível registrar a movimentação.');
    },
  });
}
