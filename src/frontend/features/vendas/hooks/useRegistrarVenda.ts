import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppDialog } from '@/shared/components/AppDialog';
import { vendasService } from '../services/vendasService';
import { RegistrarVendaRequestDto, VendaResponseDto } from '../types';
import { useCarrinho } from './useCarrinho';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';

interface UseRegistrarVendaOptions {
  onSuccessCallback?: (venda: VendaResponseDto) => void;
  troco?: number;
}

export function useRegistrarVenda(options?: UseRegistrarVendaOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const limparCarrinho = useCarrinho((state) => state.limparCarrinho);

  return useMutation({
    mutationFn: async (dto: RegistrarVendaRequestDto) => {
      if (!useConnectionStore.getState().isApiOnline) {
        throw new Error('Servidor offline. Não é possível emitir vendas sem comunicação com o servidor.');
      }
      return vendasService.registrarVenda(dto);
    },
    onSuccess: (data: VendaResponseDto) => {
      // 1. Limpa o carrinho de comanda ativa
      limparCarrinho();

      // 2. Invalida cache de produtos e estoque para forçar atualização de saldos
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });

      // 3. Executa callback opcional (fechar o modal)
      if (options?.onSuccessCallback) {
        options.onSuccessCallback(data);
      }

      // 4. Feedback visual completo com comprovante de venda
      const trocoTexto =
        options?.troco && options.troco > 0
          ? `\n💰 Troco a Devolver: R$ ${options.troco.toFixed(2).replace('.', ',')}`
          : '';

      AppDialog.success(
        'Venda Emitida com Sucesso! 🖨️',
        `Comprovante: #${data.vendaId}\nForma de Pagamento: ${data.formaPagamento}\nTotal: R$ ${data.valorTotal.toFixed(2).replace('.', ',')}${trocoTexto}\n\n✅ A dedução dos insumos da ficha técnica (BOM) foi confirmada no servidor.`
      );
    },
    onError: (error: any) => {
      const serverMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Não foi possível registrar a venda. Verifique a conexão com o servidor.';

      if (
        typeof serverMessage === 'string' &&
        (serverMessage.toLowerCase().includes('offline') ||
          serverMessage.toLowerCase().includes('network error') ||
          serverMessage.toLowerCase().includes('rede'))
      ) {
        AppDialog.error(
          'Servidor Offline 📡',
          'Não é possível registrar a venda no modo offline. Aguarde a reconexão automática ou toque em "Reconectar" no banner do topo.'
        );
        return;
      }

      const isCaixaFechado =
        error?.response?.status === 422 ||
        (typeof serverMessage === 'string' &&
          (serverMessage.toLowerCase().includes('caixa aberta') ||
            serverMessage.toLowerCase().includes('sessão de caixa')));

      if (isCaixaFechado) {
        AppDialog.confirm(
          'Caixa Fechado ⚠️',
          'Não há sessão de caixa aberta no momento. É necessário abrir o caixa para emitir vendas.\n\nDeseja ir para a tela de Caixa agora?',
          () => router.push('/(tabs)/caixa'),
          undefined,
          'Abrir Caixa',
          'Cancelar'
        );
        return;
      }

      AppDialog.error('Erro ao Registrar Venda', String(serverMessage));
    },
  });
}
