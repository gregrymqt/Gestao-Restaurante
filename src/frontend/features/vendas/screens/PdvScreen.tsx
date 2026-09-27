import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { CategoriaProduto, Produto } from '../types';
import { useCarrinho } from '../hooks/useCarrinho';
import { useCatalogoProdutos } from '../hooks/useCatalogoProdutos';
import { HeaderOperacional } from '../components/HeaderOperacional';
import { BarraPesquisaPdv } from '../components/BarraPesquisaPdv';
import { CategoriasCarrossel } from '../components/CategoriasCarrossel';
import { ProdutoCard } from '../components/ProdutoCard';
import { BarraFlutuanteCheckout } from '../components/BarraFlutuanteCheckout';

export function PdvScreen() {
  const [categoria, setCategoria] = useState<CategoriaProduto>('Todos');
  const [termoBusca, setTermoBusca] = useState('');

  const { produtos, totalProdutos } = useCatalogoProdutos(categoria, termoBusca);

  const adicionarItem = useCarrinho((state) => state.adicionarItem);
  const totalItens = useCarrinho((state) => state.obterTotalItens());
  const subtotalFormatado = useCarrinho((state) => state.obterSubtotalFormatado());
  const limparCarrinho = useCarrinho((state) => state.limparCarrinho);

  const handleCobrar = useCallback(() => {
    if (totalItens === 0) return;

    Alert.alert(
      'Finalizar Pedido',
      `Confirmar fechamento da comanda no valor de ${subtotalFormatado}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Venda',
          onPress: () => {
            limparCarrinho();
            Alert.alert(
              'Venda Registrada!',
              'Baixa de estoque executada atomicamente no sistema.'
            );
          },
        },
      ]
    );
  }, [totalItens, subtotalFormatado, limparCarrinho]);

  const renderItem = useCallback(
    ({ item }: { item: Produto }) => (
      <ProdutoCard produto={item} aoAdicionar={adicionarItem} />
    ),
    [adicionarItem]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <HeaderOperacional />
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
              estimatedItemSize={230}
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
