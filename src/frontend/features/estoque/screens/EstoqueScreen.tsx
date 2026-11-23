import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { useInsumosEstoque } from '../hooks/useInsumosEstoque';
import { useRegistrarEntradaEstoque } from '../hooks/useRegistrarEntradaEstoque';
import { useRegistrarBaixaEstoque } from '../hooks/useRegistrarBaixaEstoque';
import { useCadastrarInsumo } from '../hooks/useCadastrarInsumo';
import { EstoqueHeader } from '../components/EstoqueHeader';
import { SegmentedEstoqueControl } from '../components/SegmentedEstoqueControl';
import { FiltrosRapidosInsumos } from '../components/FiltrosRapidosInsumos';
import { InsumoSaldoCard } from '../components/InsumoSaldoCard';
import { FichasTecnicasList } from '../components/FichasTecnicasList';
import { OrdensCompraTab } from '../components/OrdensCompraTab';
import { EstoqueModalsContainer } from '../components/EstoqueModalsContainer';
import { useOrdensCompra } from '@/features/previsoes/hooks/useOrdensCompra';
import { OrdemCompraDetalhe } from '@/features/previsoes/types';
import {
  CadastrarInsumoInput,
  EntradaEstoqueInput,
  BaixaEstoqueInput,
  InsumoEstoque,
  FichaTecnicaInput,
} from '../types';

export function EstoqueScreen() {
  const insets = useSafeAreaInsets();
  const {
    abaAtiva,
    setAbaAtiva,
    filtroRapido,
    setFiltroRapido,
    busca,
    setBusca,
    insumos,
    todosInsumos,
    fichas,
    totalInsumos,
    totalFichas,
    totalCriticos,
    totalSeguros,
    isLoading,
    isRefetching,
    refetch,
    insumoSelecionado,
    isModalEntradaOpen,
    abrirModalEntrada,
    fecharModalEntrada,
    isModalFichaOpen,
    fichaEdicao,
    abrirModalNovaFicha,
    abrirModalEditarFicha,
    fecharModalFicha,
    salvarFichaMutation,
  } = useInsumosEstoque();

  const {
    ordens,
    contadores: contadoresOrdens,
    isLoading: isLoadingOrdens,
    isRefetching: isRefetchingOrdens,
    refetch: refetchOrdens,
    filtroStatus: filtroStatusOrdens,
    setFiltroStatus: setFiltroStatusOrdens,
    atualizarStatusMutation,
    receberOrdemMutation,
  } = useOrdensCompra();

  const [ordemCompradaFoco, setOrdemCompradaFoco] = useState<OrdemCompraDetalhe | null>(null);
  const [isModalCompradaOpen, setIsModalCompradaOpen] = useState(false);
  const [isModalNovoInsumoOpen, setIsModalNovoInsumoOpen] = useState(false);
  const [insumoBaixaSelecionado, setInsumoBaixaSelecionado] = useState<InsumoEstoque | null>(null);
  const [isModalBaixaOpen, setIsModalBaixaOpen] = useState(false);

  const registrarEntradaMutation = useRegistrarEntradaEstoque();
  const registrarBaixaMutation = useRegistrarBaixaEstoque();
  const cadastrarInsumoMutation = useCadastrarInsumo();

  const handleConfirmarComprada = async (dados: { fornecedor?: string; observacao?: string }) => {
    if (!ordemCompradaFoco) return;
    try {
      await atualizarStatusMutation.mutateAsync({
        id: ordemCompradaFoco.id,
        input: { novoStatus: 'APROVADA', fornecedor: dados.fornecedor, observacao: dados.observacao },
      });
      setIsModalCompradaOpen(false);
      setOrdemCompradaFoco(null);
      AppDialog.success('Ordem Aprovada', 'Marcada como comprada com sucesso!');
    } catch {
      AppDialog.error('Erro', 'Não foi possível atualizar o status da ordem.');
    }
  };

  const handleReceberOrdem = (ordem: OrdemCompraDetalhe) => {
    AppDialog.confirm('Receber Mercadoria', `Confirmar entrada de ${ordem.protocolo} no estoque?`, async () => {
      try {
        const res = await receberOrdemMutation.mutateAsync({ id: ordem.id });
        AppDialog.success('Mercadoria Recebida', res.mensagem);
      } catch {
        AppDialog.error('Erro', 'Não foi possível receber a mercadoria.');
      }
    });
  };

  const handleCancelarOrdem = (ordem: OrdemCompraDetalhe) => {
    AppDialog.confirm('Cancelar Ordem', `Deseja cancelar ${ordem.protocolo}?`, async () => {
      try {
        await atualizarStatusMutation.mutateAsync({ id: ordem.id, input: { novoStatus: 'CANCELADA' } });
        AppDialog.info('Cancelada', `Ordem ${ordem.protocolo} cancelada.`);
      } catch {
        AppDialog.error('Erro', 'Não foi possível cancelar a ordem.');
      }
    });
  };

  const handleConfirmarEntrada = async (dados: EntradaEstoqueInput) => {
    try {
      const res = await registrarEntradaMutation.mutateAsync(dados);
      fecharModalEntrada();
      AppDialog.success('Entrada Registrada', `+${dados.quantidade} adicionadas. Novo saldo: ${res.novoSaldo}.`);
    } catch {
      AppDialog.error('Erro ao Registrar Entrada', 'Não foi possível registrar a entrada de estoque.');
    }
  };

  const handleConfirmarBaixa = async (dados: BaixaEstoqueInput) => {
    try {
      await registrarBaixaMutation.mutateAsync(dados);
      setIsModalBaixaOpen(false);
      setInsumoBaixaSelecionado(null);
      AppDialog.success('Baixa Registrada', `Baixa de ${dados.quantidade} debitada com sucesso.`);
    } catch {
      AppDialog.error('Erro ao Registrar Baixa', 'Não foi possível registrar a baixa de estoque.');
    }
  };

  const handleConfirmarNovoInsumo = async (dados: CadastrarInsumoInput) => {
    await cadastrarInsumoMutation.mutateAsync(dados);
    setIsModalNovoInsumoOpen(false);
    AppDialog.success('Insumo Cadastrado', `O insumo "${dados.nome}" foi cadastrado com sucesso.`);
  };

  const handleConfirmarFicha = async (dados: FichaTecnicaInput) => {
    try {
      await salvarFichaMutation.mutateAsync(dados);
      AppDialog.success('Ficha Salva', `A ficha de "${dados.nomeProduto}" foi salva com sucesso.`);
    } catch {
      AppDialog.error('Erro ao Salvar Ficha', 'Não foi possível salvar a ficha técnica.');
    }
  };

  const handleNovoItem = () => {
    if (abaAtiva === 'insumos') {
      setIsModalNovoInsumoOpen(true);
    } else {
      abrirModalNovaFicha();
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
        {/* Header com Branding, Contadores Sincronizados, Busca e Botão + Novo */}
        <EstoqueHeader
          busca={busca}
          onBuscaChange={setBusca}
          totalInsumos={totalInsumos}
          totalFichas={totalFichas}
          abaAtiva={abaAtiva}
          onNovoItem={handleNovoItem}
        />

        {/* Segmented Control: Insumos vs Ordens vs Fichas */}
        <SegmentedEstoqueControl
          abaAtiva={abaAtiva}
          onSelectAba={setAbaAtiva}
          badgeOrdensPendentes={contadoresOrdens.pendentes}
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
            {/* Pílulas de Filtro Rápido (Todos, Críticos, Seguros) */}
            <FiltrosRapidosInsumos
              filtroAtivo={filtroRapido}
              onSelectFiltro={setFiltroRapido}
              totalTodos={totalInsumos}
              totalCriticos={totalCriticos}
              totalSeguros={totalSeguros}
            />

            {/* Lista de Insumos */}
            <View style={styles.insumosList}>
              {insumos.length === 0 ? (
                <View style={styles.emptyBuscaBox}>
                  <Search size={28} color={tokens.colors.textMuted} style={styles.emptyIcon} />
                  <ThemedText variant="body" style={styles.emptyTitulo}>
                    Nenhum insumo encontrado
                  </ThemedText>
                  <ThemedText variant="caption" color={tokens.colors.textMuted}>
                    Verifique o filtro selecionado ou adicione novos insumos.
                  </ThemedText>
                </View>
              ) : (
                insumos.map((item) => (
                  <InsumoSaldoCard
                    key={item.id}
                    item={item}
                    onRegistrarEntrada={abrirModalEntrada}
                    onRegistrarBaixa={(insumo) => {
                      setInsumoBaixaSelecionado(insumo);
                      setIsModalBaixaOpen(true);
                    }}
                  />
                ))
              )}
            </View>
          </>
        ) : abaAtiva === 'ordens' ? (
          <OrdensCompraTab
            ordens={ordens}
            isLoading={isLoadingOrdens}
            isRefetching={isRefetchingOrdens}
            refetch={refetchOrdens}
            filtroStatus={filtroStatusOrdens}
            setFiltroStatus={setFiltroStatusOrdens}
            contadores={contadoresOrdens}
            onMarcarComprada={(ordem) => { setOrdemCompradaFoco(ordem); setIsModalCompradaOpen(true); }}
            onReceberOrdem={handleReceberOrdem}
            onCancelarOrdem={handleCancelarOrdem}
          />
        ) : (
          <FichasTecnicasList fichas={fichas} onEditarFicha={abrirModalEditarFicha} />
        )}
      </ScrollView>

      <EstoqueModalsContainer
        isModalEntradaOpen={isModalEntradaOpen} insumoSelecionado={insumoSelecionado} todosInsumos={todosInsumos}
        onFecharModalEntrada={fecharModalEntrada} onConfirmarEntrada={handleConfirmarEntrada} isEnviandoEntrada={registrarEntradaMutation.isPending}
        isModalBaixaOpen={isModalBaixaOpen} insumoBaixa={insumoBaixaSelecionado}
        onFecharModalBaixa={() => { setIsModalBaixaOpen(false); setInsumoBaixaSelecionado(null); }}
        onConfirmarBaixa={handleConfirmarBaixa} isEnviandoBaixa={registrarBaixaMutation.isPending}
        isModalNovoInsumoOpen={isModalNovoInsumoOpen} onFecharModalNovoInsumo={() => setIsModalNovoInsumoOpen(false)}
        onConfirmarNovoInsumo={handleConfirmarNovoInsumo} isEnviandoNovoInsumo={cadastrarInsumoMutation.isPending}
        isModalFichaOpen={isModalFichaOpen} fichaEdicao={fichaEdicao} onFecharModalFicha={fecharModalFicha}
        onConfirmarFicha={handleConfirmarFicha} isEnviandoFicha={salvarFichaMutation.isPending}
        isModalCompradaOpen={isModalCompradaOpen} ordemCompradaFoco={ordemCompradaFoco}
        onFecharModalComprada={() => { setIsModalCompradaOpen(false); setOrdemCompradaFoco(null); }}
        onConfirmarComprada={handleConfirmarComprada} isEnviandoComprada={atualizarStatusMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { padding: tokens.spacing.xxl, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  loadingText: { marginTop: tokens.spacing.sm },
  insumosList: { paddingHorizontal: tokens.spacing.md, gap: tokens.spacing.xs },
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
  emptyIcon: { marginBottom: 6 },
  emptyTitulo: { fontWeight: '700', marginBottom: 2 },
});
