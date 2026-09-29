import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { CategoriaProduto, CriarProdutoInput, Produto } from '../types';
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

export function PdvScreen() {
  const [categoria, setCategoria] = useState<CategoriaProduto>('Todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false);

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
    Alert.alert('Produto Cadastrado! 🍔', `O produto "${dados.nome}" já está disponível para vendas.`);
  };

  const renderItem = useCallback(
    ({ item }: { item: Produto }) => (
      <ProdutoCard produto={item} aoAdicionar={adicionarItem} />
    ),
    [adicionarItem]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <HeaderOperacional onPressNovoProduto={() => setIsNovoProdutoOpen(true)} />
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
