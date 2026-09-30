import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { tokens } from '@/components/primitives/tokens';
import { useAssinatura, ModalPaywall } from '@/features/assinatura';
import { PdvScreen } from '@/features/vendas';
import { useDashboardExecutivo } from '../hooks/useDashboardExecutivo';
import { HeaderGestorBoasVindas } from '../components/HeaderGestorBoasVindas';
import { KpisFaturamentoCard } from '../components/KpisFaturamentoCard';
import { AlertaEstoqueCriticoCard } from '../components/AlertaEstoqueCriticoCard';
import { PrevisaoDemandaIaCard } from '../components/PrevisaoDemandaIaCard';
import { AtalhosOperacionaisGrid } from '../components/AtalhosOperacionaisGrid';

export function DashboardScreen() {
  const router = useRouter();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isPdvModalOpen, setIsPdvModalOpen] = useState(false);

  const { dashboard, isLoading, refetch, tenant, operador } = useDashboardExecutivo();
  const { assinatura, isAssinando, assinarPlano } = useAssinatura();

  const handleNavegarEstoque = () => router.push('/(tabs)/estoque');
  const handleNavegarCaixa = () => router.push('/(tabs)/caixa');
  const handleNavegarPrevisoes = () => router.push('/(tabs)/previsoes');
  const handleAbrirPdvTeste = () => setIsPdvModalOpen(true);

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

        {/* Modal Secundário de Demonstração / Simulador do PDV */}
        <Modal
          visible={isPdvModalOpen}
          animationType="slide"
          onRequestClose={() => setIsPdvModalOpen(false)}
        >
          <View style={styles.pdvModalContainer}>
            <PdvScreen />
          </View>
        </Modal>
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
  pdvModalContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
});
