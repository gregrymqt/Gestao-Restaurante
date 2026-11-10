import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useKdsPedidos } from '../hooks/useKdsPedidos';
import { useAgoraTick } from '../hooks/useAgoraTick';
import { KdsHeader } from '../components/KdsHeader';
import { KdsFiltrosAbas, AbaKdsAtiva } from '../components/KdsFiltrosAbas';
import { ColunaKdsKanban } from '../components/ColunaKdsKanban';
import { TicketKdsCard } from '../components/TicketKdsCard';

export function KdsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isModoKanban = width >= 768;

  const [abaAtiva, setAbaAtiva] = useState<AbaKdsAtiva>('RECEBIDO');
  const agoraMs = useAgoraTick(1000);

  const {
    pedidos,
    recebidos,
    emPreparo,
    prontos,
    isLoading,
    isFetching,
    pedidoEmAtualizacaoId,
    refetch,
    avancarStatus,
  } = useKdsPedidos();

  const listaAbaAtual =
    abaAtiva === 'RECEBIDO' ? recebidos : abaAtiva === 'EM_PREPARO' ? emPreparo : prontos;

  const handleVoltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KdsHeader
        totalAtivos={pedidos.length}
        isAtualizando={isFetching}
        onVoltar={handleVoltar}
        onRecarregar={() => refetch()}
      />

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <ThemedText variant="body" style={styles.loadingText}>
            Sincronizando pedidos da cozinha...
          </ThemedText>
        </View>
      ) : isModoKanban ? (
        <View style={styles.kanbanRow}>
          <ColunaKdsKanban
            titulo="Novos Pedidos"
            corIndicador="#EA580C"
            pedidos={recebidos}
            agoraMs={agoraMs}
            pedidoEmAtualizacaoId={pedidoEmAtualizacaoId}
            onAvancarStatus={avancarStatus}
          />
          <ColunaKdsKanban
            titulo="Em Preparo"
            corIndicador="#D97706"
            pedidos={emPreparo}
            agoraMs={agoraMs}
            pedidoEmAtualizacaoId={pedidoEmAtualizacaoId}
            onAvancarStatus={avancarStatus}
          />
          <ColunaKdsKanban
            titulo="Prontos / Balcão"
            corIndicador="#16A34A"
            pedidos={prontos}
            agoraMs={agoraMs}
            pedidoEmAtualizacaoId={pedidoEmAtualizacaoId}
            onAvancarStatus={avancarStatus}
          />
        </View>
      ) : (
        <View style={styles.mobileContainer}>
          <KdsFiltrosAbas
            abaAtiva={abaAtiva}
            onChangeAba={setAbaAtiva}
            contadores={{
              recebidos: recebidos.length,
              emPreparo: emPreparo.length,
              prontos: prontos.length,
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mobileList}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={() => refetch()}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
          >
            {listaAbaAtual.length === 0 ? (
              <View style={styles.emptyBox}>
                <ThemedText style={styles.emptyEmoji}>👨‍🍳</ThemedText>
                <ThemedText variant="subtitle" weight="bold" style={styles.emptyTitle}>
                  Nenhum pedido nesta etapa
                </ThemedText>
                <ThemedText variant="caption" style={styles.emptySub}>
                  Novas comandas emitidas no PDV surgirão aqui automaticamente em tempo real.
                </ThemedText>
              </View>
            ) : (
              listaAbaAtual.map((pedido) => (
                <TicketKdsCard
                  key={pedido.vendaId}
                  pedido={pedido}
                  agoraMs={agoraMs}
                  isProcessando={pedidoEmAtualizacaoId === pedido.vendaId}
                  onAvancarStatus={avancarStatus}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  loadingText: {
    color: tokens.colors.textSecondary,
  },
  kanbanRow: {
    flex: 1,
    flexDirection: 'row',
    gap: tokens.spacing.md,
    padding: tokens.spacing.md,
  },
  mobileContainer: {
    flex: 1,
  },
  mobileList: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl * 2,
  },
  emptyBox: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
    gap: tokens.spacing.xs,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: tokens.spacing.xs,
  },
  emptyTitle: {
    color: tokens.colors.textPrimary,
  },
  emptySub: {
    color: tokens.colors.textSecondary,
    textAlign: 'center',
  },
});
