import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { vendasService } from '../services/vendasService';
import { RegistrarVendaRequestDto, VendaResponseDto } from '../types';
import { useCarrinho } from './useCarrinho';

interface UseRegistrarVendaOptions {
  onSuccessCallback?: (venda: VendaResponseDto) => void;
  troco?: number;
}

export function useRegistrarVenda(options?: UseRegistrarVendaOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const limparCarrinho = useCarrinho((state) => state.limparCarrinho);

  return useMutation({
    mutationFn: (dto: RegistrarVendaRequestDto) => vendasService.registrarVenda(dto),
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

      Alert.alert(
        'Venda Emitida com Sucesso! 🖨️',
        `Comprovante: #${data.vendaId}\nForma de Pagamento: ${data.formaPagamento}\nTotal: R$ ${data.valorTotal.toFixed(2).replace('.', ',')}${trocoTexto}\n\n✅ A dedução dos insumos da ficha técnica (BOM) foi confirmada no servidor.`,
        [{ text: 'Concluir', style: 'default' }]
      );
    },
    onError: (error: any) => {
      const serverMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Não foi possível registrar a venda. Verifique a conexão com o servidor.';

      const isCaixaFechado =
        error?.response?.status === 422 ||
        (typeof serverMessage === 'string' &&
          (serverMessage.toLowerCase().includes('caixa aberta') ||
            serverMessage.toLowerCase().includes('sessão de caixa')));

      if (isCaixaFechado) {
        Alert.alert(
          'Caixa Fechado ⚠️',
          'Não há sessão de caixa aberta no momento. É necessário abrir o caixa para emitir vendas.\n\nDeseja ir para a tela de Caixa agora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Caixa',
              style: 'default',
              onPress: () => router.push('/(tabs)/caixa'),
            },
          ]
        );
        return;
      }

      Alert.alert('Erro ao Registrar Venda', String(serverMessage));
    },
  });
}
