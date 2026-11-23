import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokens } from '@/components/primitives/tokens';
import { useSseStatus } from '@/shared';
import { AppDialog } from '@/shared/components/AppDialog';
import { gerarMensagemOrdemCompraWhatsApp } from '@/shared/utils/formatters';
import { useAssinatura, ModalPaywall } from '@/features/assinatura';
import { OrdemCompraModal, previsoesService } from '@/features/previsoes';
import { estoqueService } from '@/features/estoque';
import { ModalHistoricoVendas } from '@/features/vendas';
import { useDashboardExecutivo } from '../hooks/useDashboardExecutivo';
import { HeaderGestorBoasVindas } from '../components/HeaderGestorBoasVindas';
import { HeroActionsGrid } from '../components/HeroActionsGrid';
import { KpisFaturamentoCard } from '../components/KpisFaturamentoCard';
import { AlertaEstoqueCriticoCard, OrdemPendenteResumo } from '../components/AlertaEstoqueCriticoCard';
import { PrevisaoDemandaIaCard } from '../components/PrevisaoDemandaIaCard';
import { AtalhosOperacionaisGrid } from '../components/AtalhosOperacionaisGrid';

export function DashboardScreen() {
  const router = useRouter();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isOrdemCompraOpen, setIsOrdemCompraOpen] = useState(false);
  const [isHistoricoVendasOpen, setIsHistoricoVendasOpen] = useState(false);
  const [ordemPendente, setOrdemPendente] = useState<OrdemPendenteResumo | null>(null);
  const [isRecebendo, setIsRecebendo] = useState(false);

  const { dashboard, isLoading, refetch, tenant, operador } = useDashboardExecutivo();
  const { assinatura, isAssinando, assinarPlano } = useAssinatura();
  const sseStatus = useSseStatus((state) => state.status);
  const isOffline = sseStatus !== 'CONNECTED';
  const queryClient = useQueryClient();

  const ordemCompraMutation = useMutation({
    mutationFn: (pedido: {
      insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
      valorTotal: number;
    }) => previsoesService.enviarOrdemCompra(pedido),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-executivo'] });
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
      queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
    },
  });

  const handleConfirmarOrdemCompra = async (pedido: {
    insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
    valorTotal: number;
  }) => {
    try {
      const res = await ordemCompraMutation.mutateAsync(pedido);
      setIsOrdemCompraOpen(false);
      setOrdemPendente({
        protocolo: res.protocolo,
        itens: pedido.insumos,
        valorTotal: pedido.valorTotal,
      });
      await refetch();

      const mensagemWhats = gerarMensagemOrdemCompraWhatsApp({
        protocolo: res.protocolo,
        insumos: pedido.insumos,
        valorTotal: pedido.valorTotal,
      });

      AppDialog.confirm(
        'Ordem de Compra Emitida',
        `Pedido registrado sob protocolo ${res.protocolo}.\n\nDeseja compartilhar a lista de compras via WhatsApp com o fornecedor homologado?`,
        async () => {
          const url = `https://wa.me/?text=${encodeURIComponent(mensagemWhats)}`;
          try {
            await Linking.openURL(url);
          } catch {
            await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhats)}`);
          }
        },
        undefined,
        'Enviar WhatsApp',
        'Concluir'
      );
    } catch {
      AppDialog.error('Erro', 'Não foi possível registrar a ordem de compra.');
    }
  };

  const handleReceberOrdemCompra = () => {
    if (!ordemPendente) return;

    AppDialog.confirm(
      'Receber Mercadoria',
      `Confirmar o recebimento dos ${ordemPendente.itens.length} insumos da ordem ${ordemPendente.protocolo}?\n\nO saldo será creditado no estoque físico imediatamente.`,
      async () => {
        setIsRecebendo(true);
        try {
          for (const item of ordemPendente.itens) {
            await estoqueService.registrarEntradaEstoque({
              insumoId: item.insumoId,
              quantidade: item.quantidade,
              observacao: `Recebimento da Ordem de Compra ${ordemPendente.protocolo}`,
            });
          }

          setOrdemPendente(null);
          queryClient.invalidateQueries({ queryKey: ['dashboard-executivo'] });
          queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
          queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
          await refetch();

          AppDialog.success(
            'Estoque Atualizado',
            'Mercadoria conferida e adicionada ao estoque físico com sucesso!'
          );
        } catch {
          AppDialog.error('Erro', 'Não foi possível registrar a entrada da mercadoria no estoque.');
        } finally {
          setIsRecebendo(false);
        }
      },
      undefined,
      'Dar Entrada',
      'Cancelar'
    );
  };

  const sugestoesCompra = dashboard.insumosCriticos.map((i) => {
    const isPao = i.nome.toLowerCase().includes('pão') || i.nome.toLowerCase().includes('pao');
    const precoEstimado = isPao ? 1.80 : (i.unidadeMedida?.toLowerCase() === 'un' ? 3.50 : 25.0);

    return {
      insumoId: i.id,
      nomeInsumo: i.nome,
      unidadeMedida: i.unidadeMedida,
      stockAtual: i.quantidadeAtual,
      stockNecessario: i.quantidadeMinima * 2,
      quantidadeComprar: Math.max(i.quantidadeMinima * 2 - i.quantidadeAtual, i.quantidadeMinima),
      precoEstimadoUnitario: precoEstimado,
    };
  });

  const handleNavegarEstoque = () => router.push('/(tabs)/estoque');
  const handleNavegarCaixa = () => router.push('/(tabs)/caixa');
  const handleNavegarPrevisoes = () => router.push('/(tabs)/previsoes');
  const handleAbrirPdvTeste = () => router.push('/(tabs)/pdv');
  const handleAbrirKds = () => router.push('/kds');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header com Boas-Vindas e Status do Restaurante */}
        <HeaderGestorBoasVindas
          nomeGestor={operador?.nome || 'Proprietário'}
          nomeRestaurante={tenant?.nome || 'Restaurante Inteligente'}
          statusLoja={dashboard.statusLoja}
          turnoAtual={dashboard.turnoAtual}
          assinatura={assinatura}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { void refetch(); }}
              colors={[tokens.colors.primary]}
              tintColor={tokens.colors.primary}
            />
          }
        >
          {/* Zona de Ação Primária: PDV e KDS */}
          <HeroActionsGrid
            pedidosNaCozinha={dashboard.kpis.pedidosNaCozinha ?? 0}
            isOffline={isOffline}
            onAbrirPdv={handleAbrirPdvTeste}
            onAbrirKds={handleAbrirKds}
          />

          {/* Alertas Reativos de Estoque Crítico (SSE) */}
          <AlertaEstoqueCriticoCard
            insumos={dashboard.insumosCriticos}
            ordemPendente={ordemPendente}
            onNavegarEstoque={handleNavegarEstoque}
            onAbrirOrdemCompra={() => setIsOrdemCompraOpen(true)}
            onReceberOrdemCompra={handleReceberOrdemCompra}
            onVerOrdensCompra={() => router.push({ pathname: '/(tabs)/estoque', params: { aba: 'ordens' } })}
            isRecebendo={isRecebendo}
          />

          {/* Card: KPIs Financeiros e Faturamento do Dia (clicável para histórico) */}
          <KpisFaturamentoCard
            kpis={dashboard.kpis}
            onPress={() => setIsHistoricoVendasOpen(true)}
          />

          {/* Previsão Preditiva de Demanda com IA */}
          <PrevisaoDemandaIaCard
            previsao={dashboard.previsaoIa}
            onNavegarPrevisoes={handleNavegarPrevisoes}
          />

          {/* Grade de Atalhos Operacionais Rápidos */}
          <AtalhosOperacionaisGrid
            onNavegarCaixa={handleNavegarCaixa}
          />
        </ScrollView>

        {/* Modal de Histórico de Vendas Concluídas */}
        <ModalHistoricoVendas
          visible={isHistoricoVendasOpen}
          onClose={() => setIsHistoricoVendasOpen(false)}
        />

        {/* Modal Rápido de Ordem de Compra / Reposição de Insumos Críticos */}
        <OrdemCompraModal
          visible={isOrdemCompraOpen}
          sugestoes={sugestoesCompra}
          onClose={() => setIsOrdemCompraOpen(false)}
          onConfirmar={handleConfirmarOrdemCompra}
          isEnviando={ordemCompraMutation.isPending}
        />

        {/* Modal Paywall de Planos e Assinatura SaaS */}
        <ModalPaywall
          visible={isPaywallOpen}
          assinatura={assinatura}
          isAssinando={isAssinando}
          onConfirmar={(planoId) => {
            assinarPlano(planoId, {
              onSuccess: () => setIsPaywallOpen(false),
            });
          }}
          onClose={() => setIsPaywallOpen(false)}
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
  scrollContent: {
    paddingBottom: tokens.spacing.xl,
  },
});
