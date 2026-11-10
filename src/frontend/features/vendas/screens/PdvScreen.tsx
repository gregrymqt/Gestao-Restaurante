import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { AppDialog } from '@/shared/components/AppDialog';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CategoriaProduto, CriarProdutoInput, Produto, ModificadorSelecionado } from '../types';
import { vendasService } from '../services/vendasService';
import { useCarrinho } from '../hooks/useCarrinho';
import { useCatalogoProdutos } from '../hooks/useCatalogoProdutos';
import { useCriarProduto } from '../hooks/useCriarProduto';
import { HeaderOperacional } from '../components/HeaderOperacional';
import { BarraPesquisaPdv } from '../components/BarraPesquisaPdv';
import { CategoriasCarrossel } from '../components/CategoriasCarrossel';
import { ProdutoCard } from '../components/ProdutoCard';
import { BarraFlutuanteCheckout } from '../components/BarraFlutuanteCheckout';
import { CheckoutBottomSheet } from '../components/CheckoutBottomSheet';
import { ModalNovoProduto } from '../components/ModalNovoProduto';
import { ModalHistoricoVendas } from '../components/ModalHistoricoVendas';
import { ModalModificadoresProduto } from '../components/ModalModificadoresProduto';

export function PdvScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [categoria, setCategoria] = useState<CategoriaProduto>('Todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [produtoModificadores, setProdutoModificadores] = useState<Produto | null>(null);

  const { produtos, totalProdutos } = useCatalogoProdutos(categoria, termoBusca);
  const criarProdutoMutation = useCriarProduto();

  const adicionarItem = useCarrinho((state) => state.adicionarItem);
  const totalItens = useCarrinho((state) => state.obterTotalItens());
  const subtotalFormatado = useCarrinho((state) => state.obterSubtotalFormatado());

  const handleCobrar = useCallback(() => {
    if (totalItens > 0) {
      setIsCheckoutOpen(true);
    }
  }, [totalItens]);

  const handleConfirmarNovoProduto = async (dados: CriarProdutoInput) => {
    await criarProdutoMutation.mutateAsync(dados);
    setIsNovoProdutoOpen(false);
    AppDialog.success('Produto Cadastrado! 🍔', `O produto "${dados.nome}" já está disponível para vendas.`);
  };

  const handleTocarProduto = useCallback(
    async (produto: Produto) => {
      try {
        const modificadores = await queryClient.fetchQuery({
          queryKey: ['produtos', produto.id, 'modificadores'],
          queryFn: () => vendasService.obterModificadoresProduto(produto.id),
          staleTime: 5 * 60 * 1000,
        });

        if (modificadores && modificadores.length > 0) {
          setProdutoModificadores(produto);
        } else {
          adicionarItem(produto);
        }
      } catch {
        adicionarItem(produto);
      }
    },
    [queryClient, adicionarItem]
  );

  const handleConfirmarModificadores = useCallback(
    (modificadores: ModificadorSelecionado[]) => {
      if (produtoModificadores) {
        adicionarItem(produtoModificadores, modificadores);
        setProdutoModificadores(null);
      }
    },
    [produtoModificadores, adicionarItem]
  );

  const renderItem = useCallback(
    ({ item }: { item: Produto }) => (
      <ProdutoCard produto={item} aoAdicionar={handleTocarProduto} />
    ),
    [handleTocarProduto]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <HeaderOperacional
          onPressVoltar={() => router.push('/(tabs)')}
          onPressNovoProduto={() => setIsNovoProdutoOpen(true)}
          onPressHistorico={() => setIsHistoricoOpen(true)}
          onPressKds={() => router.push('/kds')}
        />
        <BarraPesquisaPdv
          valor={termoBusca}
          aoMudarTexto={setTermoBusca}
          aoLimpar={() => setTermoBusca('')}
        />
        <CategoriasCarrossel
          categoriaSelecionada={categoria}
          aoSelecionarCategoria={setCategoria}
        />

        <View style={styles.listWrapper}>
          {totalProdutos === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText variant="subtitle" color={tokens.colors.textMuted}>
                Nenhum produto encontrado.
              </ThemedText>
            </View>
          ) : (
            <FlashList
              data={produtos}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <BarraFlutuanteCheckout
          totalItens={totalItens}
          subtotalFormatado={subtotalFormatado}
          aoCobrar={handleCobrar}
        />

        {/* Modal Deslizante de Cobrança e Checkout */}
        <CheckoutBottomSheet
          visible={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />

        {/* Modal para Cadastro de Novo Produto e Ficha Técnica */}
        <ModalNovoProduto
          visible={isNovoProdutoOpen}
          onClose={() => setIsNovoProdutoOpen(false)}
          onConfirmar={handleConfirmarNovoProduto}
          isEnviando={criarProdutoMutation.isPending}
        />

        {/* Modal de Histórico de Vendas Concluídas */}
        <ModalHistoricoVendas
          visible={isHistoricoOpen}
          onClose={() => setIsHistoricoOpen(false)}
        />

        {/* Modal de Modificadores e Tags (Zero-Typing) */}
        <ModalModificadoresProduto
          produto={produtoModificadores}
          visible={Boolean(produtoModificadores)}
          onClose={() => setProdutoModificadores(null)}
          onConfirmar={handleConfirmarModificadores}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: tokens.spacing.sm,
  },
  listContent: {
    paddingTop: tokens.spacing.sm,
    paddingBottom: 96, // Espaço para não cobrir itens sob a barra flutuante
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxl,
  },
});
