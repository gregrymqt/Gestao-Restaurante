import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useCapacidadeProducao } from '../hooks/useCapacidadeProducao';
import { PrevisoesHeader } from '../components/PrevisoesHeader';
import { GargaloCriticoCard } from '../components/GargaloCriticoCard';
import { ProjecaoProdutoCard } from '../components/ProjecaoProdutoCard';
import { SugestaoReposicaoCard } from '../components/SugestaoReposicaoCard';
import { ContextoMeteorologicoBox } from '../components/ContextoMeteorologicoBox';
import { OrdemCompraModal } from '../components/OrdemCompraModal';
import { FichaTecnicaModal } from '../components/FichaTecnicaModal';

export function PrevisoesScreen() {
  const insets = useSafeAreaInsets();
  const {
    relatorio,
    isLoading,
    isRefetching,
    refetch,
    dataAlvo,
    setDataAlvo,
    datasFiltro,
    produtoFicha,
    fichaIngredientes,
    isFichaModalOpen,
    abrirFichaTecnica,
    fecharFichaTecnica,
    isOrdemCompraOpen,
    abrirOrdemCompra,
    fecharOrdemCompra,
    ordemCompraMutation,
    gargaloPrincipal,
    perdaTotalEstimada,
  } = useCapacidadeProducao();

  const handleConfirmarOrdemCompra = async (pedido: {
    insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number }>;
    valorTotal: number;
  }) => {
    try {
      const res = await ordemCompraMutation.mutateAsync(pedido);
      Alert.alert(
        'Ordem de Compra Emitida',
        `Pedido registrado com sucesso sob protocolo ${res.protocolo}. Solicitação enviada aos fornecedores homologados.`
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a ordem de compra.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[tokens.colors.primary]}
            tintColor={tokens.colors.primary}
          />
        }
      >
        <PrevisoesHeader
          datasFiltro={datasFiltro}
          dataSelecionada={dataAlvo}
          onSelectData={setDataAlvo}
        />

        {isLoading && !relatorio ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.loadingText}>
              Consultando modelo de Machine Learning e estoque...
            </ThemedText>
          </View>
        ) : (
          <>
            <GargaloCriticoCard
              gargalo={gargaloPrincipal}
              perdaTotal={perdaTotalEstimada}
              onSugerirPedido={abrirOrdemCompra}
            />

            <ProjecaoProdutoCard
              itens={relatorio?.itensCapacidade || []}
              onSelectProduto={abrirFichaTecnica}
            />

            <SugestaoReposicaoCard
              sugestoes={relatorio?.sugestoesReposicao || []}
              onGerarOrdemCompra={abrirOrdemCompra}
            />

            <ContextoMeteorologicoBox
              temperatura={relatorio?.contextoClimatico?.temperatura}
              condicao={relatorio?.contextoClimatico?.condicao}
              precipitacaoMm={relatorio?.contextoClimatico?.precipitacaoMm}
              impactoDescricao={relatorio?.contextoClimatico?.impactoDescricao}
            />
          </>
        )}
      </ScrollView>

      <OrdemCompraModal
        visible={isOrdemCompraOpen}
        sugestoes={relatorio?.sugestoesReposicao || []}
        onClose={fecharOrdemCompra}
        onConfirmar={handleConfirmarOrdemCompra}
        isEnviando={ordemCompraMutation.isPending}
      />

      <FichaTecnicaModal
        visible={isFichaModalOpen}
        produto={produtoFicha}
        ingredientes={fichaIngredientes}
        onClose={fecharFichaTecnica}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xl,
  },
  loadingContainer: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: tokens.spacing.sm,
  },
});
