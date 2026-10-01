import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { tokens } from '@/components/primitives/tokens';
import { useAssinatura, ModalPaywall } from '@/features/assinatura';
import { OrdemCompraModal } from '@/features/previsoes';
import { useDashboardExecutivo } from '../hooks/useDashboardExecutivo';
import { HeaderGestorBoasVindas } from '../components/HeaderGestorBoasVindas';
import { KpisFaturamentoCard } from '../components/KpisFaturamentoCard';
import { AlertaEstoqueCriticoCard } from '../components/AlertaEstoqueCriticoCard';
import { PrevisaoDemandaIaCard } from '../components/PrevisaoDemandaIaCard';
import { AtalhosOperacionaisGrid } from '../components/AtalhosOperacionaisGrid';

export function DashboardScreen() {
  const router = useRouter();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isOrdemCompraOpen, setIsOrdemCompraOpen] = useState(false);

  const { dashboard, isLoading, refetch, tenant, operador } = useDashboardExecutivo();
  const { assinatura, isAssinando, assinarPlano } = useAssinatura();

  const sugestoesCompra = dashboard.insumosCriticos.map((i) => ({
    insumoId: i.id,
    nomeInsumo: i.nome,
    unidadeMedida: i.unidadeMedida,
    stockAtual: i.quantidadeAtual,
    stockNecessario: i.quantidadeMinima * 2,
    quantidadeComprar: Math.max(i.quantidadeMinima * 2 - i.quantidadeAtual, i.quantidadeMinima),
    precoEstimadoUnitario: 25.0,
  }));

  const handleNavegarEstoque = () => router.push('/(tabs)/estoque');
  const handleNavegarCaixa = () => router.push('/(tabs)/caixa');
  const handleNavegarPrevisoes = () => router.push('/(tabs)/previsoes');
  const handleAbrirPdvTeste = () => router.push('/(tabs)/pdv');

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
              onRefresh={refetch}
              colors={[tokens.colors.primary]}
              tintColor={tokens.colors.primary}
            />
          }
        >
          {/* Card 1: KPIs Financeiros e Faturamento do Dia */}
          <KpisFaturamentoCard kpis={dashboard.kpis} />

          {/* Card 2: Alertas Reativos de Estoque Crítico (SSE) */}
          <AlertaEstoqueCriticoCard
            insumos={dashboard.insumosCriticos}
            onNavegarEstoque={handleNavegarEstoque}
            onAbrirOrdemCompra={() => setIsOrdemCompraOpen(true)}
          />

          {/* Card 3: Previsão Preditiva de Demanda com IA */}
          <PrevisaoDemandaIaCard
            previsao={dashboard.previsaoIa}
            onNavegarPrevisoes={handleNavegarPrevisoes}
          />

          {/* Grade de Atalhos Operacionais Rápidos */}
          <AtalhosOperacionaisGrid
            onNavegarEstoque={handleNavegarEstoque}
            onNavegarCaixa={handleNavegarCaixa}
            onNavegarPrevisoes={handleNavegarPrevisoes}
            onAbrirPdvTeste={handleAbrirPdvTeste}
          />
        </ScrollView>

        {/* Modal Rápido de Ordem de Compra / Reposição de Insumos Críticos */}
        <OrdemCompraModal
          visible={isOrdemCompraOpen}
          sugestoes={sugestoesCompra}
          onClose={() => setIsOrdemCompraOpen(false)}
          onConfirmar={async (pedido) => {
            setIsOrdemCompraOpen(false);
            await refetch();
          }}
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
