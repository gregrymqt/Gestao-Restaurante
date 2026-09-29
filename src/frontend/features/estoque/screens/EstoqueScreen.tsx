import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { useInsumosEstoque } from '../hooks/useInsumosEstoque';
import { useRegistrarEntradaEstoque } from '../hooks/useRegistrarEntradaEstoque';
import { useCadastrarInsumo } from '../hooks/useCadastrarInsumo';
import { EstoqueHeader } from '../components/EstoqueHeader';
import { SegmentedEstoqueControl } from '../components/SegmentedEstoqueControl';
import { InsumoSaldoCard } from '../components/InsumoSaldoCard';
import { FichaTecnicaDestaqueCard } from '../components/FichaTecnicaDestaqueCard';
import { FichasTecnicasList } from '../components/FichasTecnicasList';
import { FabEntradaMercadoria } from '../components/FabEntradaMercadoria';
import { ModalEntradaEstoque } from '../components/ModalEntradaEstoque';
import { ModalNovoInsumo } from '../components/ModalNovoInsumo';
import { CadastrarInsumoInput, EntradaEstoqueInput } from '../types';

export function EstoqueScreen() {
  const insets = useSafeAreaInsets();
  const {
    abaAtiva,
    setAbaAtiva,
    busca,
    setBusca,
    insumos,
    todosInsumos,
    fichas,
    fichaDestaque,
    totalInsumos,
    totalFichas,
    isLoading,
    isRefetching,
    refetch,
    insumoSelecionado,
    isModalEntradaOpen,
    abrirModalEntrada,
    fecharModalEntrada,
  } = useInsumosEstoque();

  const [isModalNovoInsumoOpen, setIsModalNovoInsumoOpen] = useState(false);
  const registrarEntradaMutation = useRegistrarEntradaEstoque();
  const cadastrarInsumoMutation = useCadastrarInsumo();

  const handleConfirmarEntrada = async (dados: EntradaEstoqueInput) => {
    try {
      const res = await registrarEntradaMutation.mutateAsync(dados);
      fecharModalEntrada();
      AppDialog.success(
        'Entrada Registrada no Ledger',
        `Entrada de +${dados.quantidade} confirmada com sucesso!\nNovo saldo: ${res.novoSaldo}.\nProtocolo: ${res.protocoloLedger}`
      );
    } catch {
      AppDialog.error('Erro ao Registrar Entrada', 'Não foi possível registrar a entrada de estoque.');
    }
  };

  const handleConfirmarNovoInsumo = async (dados: CadastrarInsumoInput) => {
    await cadastrarInsumoMutation.mutateAsync(dados);
    setIsModalNovoInsumoOpen(false);
    AppDialog.success('Insumo Cadastrado! 📦', `O insumo "${dados.nome}" foi cadastrado com sucesso.`);
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
        {/* Header com Branding, Contadores e Busca */}
        <EstoqueHeader
          busca={busca}
          onBuscaChange={setBusca}
          totalInsumos={totalInsumos}
          totalFichas={totalFichas}
        />

        {/* Segmented Control: Insumos vs Fichas Técnicas */}
        <SegmentedEstoqueControl
          abaAtiva={abaAtiva}
          onSelectAba={setAbaAtiva}
        />

        {isLoading && todosInsumos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.loadingText}>
              Sincronizando livro-razão de suprimentos...
            </ThemedText>
          </View>
        ) : abaAtiva === 'insumos' ? (
          <>
            {/* Seção Níveis de Estoque com Botão Novo Insumo e Legenda */}
            <View style={styles.secaoNiveisHeader}>
              <ThemedText variant="title" style={styles.secaoTitulo}>
                Níveis de Estoque
              </ThemedText>

              <View style={styles.acoesHeaderRow}>
                <TouchableOpacity
                  style={styles.btnNovoInsumo}
                  onPress={() => setIsModalNovoInsumoOpen(true)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.btnNovoInsumoText}>+ Novo Insumo</ThemedText>
                </TouchableOpacity>

                <View style={styles.legendaRow}>
                  <View style={styles.legendaItem}>
                    <View style={[styles.legendaDot, { backgroundColor: tokens.colors.status.redText }]} />
                    <ThemedText variant="caption" style={styles.legendaTexto}>
                      Crítico
                    </ThemedText>
                  </View>

                  <View style={styles.legendaItem}>
                    <View style={[styles.legendaDot, { backgroundColor: tokens.colors.status.orangeText }]} />
                    <ThemedText variant="caption" style={styles.legendaTexto}>
                      Atenção
                    </ThemedText>
                  </View>

                  <View style={styles.legendaItem}>
                    <View style={[styles.legendaDot, { backgroundColor: tokens.colors.status.greenText }]} />
                    <ThemedText variant="caption" style={styles.legendaTexto}>
                      Normal
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Lista de Insumos */}
            <View style={styles.insumosList}>
              {insumos.length === 0 ? (
                <View style={styles.emptyBuscaBox}>
                  <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
                  <ThemedText variant="body" style={styles.emptyTitulo}>
                    Nenhum insumo encontrado
                  </ThemedText>
                  <ThemedText variant="caption" color={tokens.colors.textMuted}>
                    Verifique o termo buscado ou adicione novos insumos.
                  </ThemedText>
                </View>
              ) : (
                insumos.map((item) => (
                  <InsumoSaldoCard
                    key={item.id}
                    item={item}
                    onRegistrarEntrada={abrirModalEntrada}
                  />
                ))
              )}
            </View>

            {/* Ficha Técnica em Destaque */}
            <FichaTecnicaDestaqueCard
              ficha={fichaDestaque}
              totalFichas={totalFichas}
              onVerTodas={() => setAbaAtiva('fichas')}
            />
          </>
        ) : (
          /* Aba Fichas Técnicas */
          <FichasTecnicasList fichas={fichas} />
        )}
      </ScrollView>

      {/* FAB Flutuante para Registro de Entrada Geral */}
      <FabEntradaMercadoria onPress={() => abrirModalEntrada()} />

      {/* Modal Deslizante para Entrada no Ledger */}
      <ModalEntradaEstoque
        visible={isModalEntradaOpen}
        insumoInicial={insumoSelecionado}
        todosInsumos={todosInsumos}
        onClose={fecharModalEntrada}
        onConfirmar={handleConfirmarEntrada}
        isEnviando={registrarEntradaMutation.isPending}
      />

      {/* Modal para Cadastro de Novo Insumo */}
      <ModalNovoInsumo
        visible={isModalNovoInsumoOpen}
        onClose={() => setIsModalNovoInsumoOpen(false)}
        onConfirmar={handleConfirmarNovoInsumo}
        isEnviando={cadastrarInsumoMutation.isPending}
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
    paddingBottom: 80,
  },
  loadingContainer: {
    padding: tokens.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: tokens.spacing.sm,
  },
  secaoNiveisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.xs + 2,
    flexWrap: 'wrap',
    gap: 8,
  },
  secaoTitulo: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  acoesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnNovoInsumo: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnNovoInsumoText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  legendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendaTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  insumosList: {
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.xs,
  },
  emptyBuscaBox: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: tokens.spacing.md,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyTitulo: {
    fontWeight: '700',
    marginBottom: 2,
  },
});
