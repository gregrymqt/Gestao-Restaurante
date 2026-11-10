import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useAssinatura, ModalPaywall } from '@/features/assinatura';
import { OrdemCompraModal } from '@/features/previsoes';
import { ModalHistoricoVendas } from '@/features/vendas';
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
  const [isHistoricoVendasOpen, setIsHistoricoVendasOpen] = useState(false);

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
              onRefresh={refetch}
              colors={[tokens.colors.primary]}
              tintColor={tokens.colors.primary}
            />
          }
        >
          {/* Card 1: KPIs Financeiros e Faturamento do Dia */}
          <KpisFaturamentoCard kpis={dashboard.kpis} />

          {/* Botão Operacional: Ver Histórico de Vendas */}
          <Pressable
            style={({ pressed }) => [styles.btnHistorico, pressed && styles.btnHistoricoPressed]}
            onPress={() => setIsHistoricoVendasOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ver Histórico de Vendas do Dia"
          >
            <View style={styles.btnHistoricoLeft}>
              <ThemedText style={styles.btnHistoricoIcone}>🧾</ThemedText>
              <View>
                <ThemedText variant="body" weight="bold" style={styles.btnHistoricoTexto}>
                  Histórico de Vendas do Dia
                </ThemedText>
                <ThemedText variant="caption" style={styles.btnHistoricoSub}>
                  {dashboard.kpis.quantidadePedidos} {dashboard.kpis.quantidadePedidos === 1 ? 'pedido registrado' : 'pedidos registrados'} • Toque para auditar cupons
                </ThemedText>
              </View>
            </View>
            <ThemedText variant="subtitle" weight="bold" style={styles.btnHistoricoSeta}>
              →
            </ThemedText>
          </Pressable>

          {/* Botão Operacional: Painel da Cozinha (KDS) */}
          <Pressable
            style={({ pressed }) => [styles.btnHistorico, pressed && styles.btnHistoricoPressed]}
            onPress={handleAbrirKds}
            accessibilityRole="button"
            accessibilityLabel="Abrir Painel da Cozinha KDS"
          >
            <View style={styles.btnHistoricoLeft}>
              <ThemedText style={styles.btnHistoricoIcone}>👨‍🍳</ThemedText>
              <View>
                <ThemedText variant="body" weight="bold" style={styles.btnHistoricoTexto}>
                  Painel da Cozinha (KDS)
                </ThemedText>
                <ThemedText variant="caption" style={styles.btnHistoricoSub}>
                  {dashboard.kpis.pedidosNaCozinha ?? 0}{' '}
                  {(dashboard.kpis.pedidosNaCozinha ?? 0) === 1 ? 'pedido em preparo na chapa' : 'pedidos ativos na cozinha'} • Tela cheia
                </ThemedText>
              </View>
            </View>
            <ThemedText variant="subtitle" weight="bold" style={styles.btnHistoricoSeta}>
              →
            </ThemedText>
          </Pressable>

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
  btnHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.card,
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  btnHistoricoPressed: {
    opacity: 0.8,
    backgroundColor: tokens.colors.primaryLight,
  },
  btnHistoricoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  btnHistoricoIcone: {
    fontSize: 22,
    marginRight: 12,
  },
  btnHistoricoTexto: {
    color: tokens.colors.textPrimary,
  },
  btnHistoricoSub: {
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  btnHistoricoSeta: {
    color: tokens.colors.primary,
    marginLeft: 8,
  },
});
