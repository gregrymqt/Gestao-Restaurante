import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useHistoricoVendas } from '../hooks/useHistoricoVendas';
import { CardVendaHistorico } from './CardVendaHistorico';
import { ModalDetalheVenda } from './ModalDetalheVenda';
import { VendaHistorico } from '../types';

interface ModalHistoricoVendasProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalHistoricoVendas({ visible, onClose }: ModalHistoricoVendasProps) {
  const insets = useSafeAreaInsets();
  const { vendas, totalVendas, faturamentoTotal, isLoading, isRefreshing, refetch } =
    useHistoricoVendas();

  const [vendaSelecionada, setVendaSelecionada] = useState<VendaHistorico | null>(null);

  React.useEffect(() => {
    if (visible) {
      refetch();
    }
  }, [visible]);

  const totalFormatado = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.btnVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ThemedText variant="subtitle" weight="bold" style={styles.setaVoltar}>
              ←
            </ThemedText>
          </Pressable>

          <View style={styles.tituloBox}>
            <ThemedText variant="subtitle" weight="bold" style={styles.titulo}>
              Histórico de Vendas
            </ThemedText>
            <ThemedText variant="caption" style={styles.subtitulo}>
              {totalVendas} {totalVendas === 1 ? 'pedido concluído' : 'pedidos concluídos'}
            </ThemedText>
          </View>

          <View style={styles.faturamentoBadge}>
            <ThemedText variant="caption" weight="bold" style={styles.faturamentoValor}>
              {totalFormatado}
            </ThemedText>
          </View>
        </View>

        {/* Lista de Vendas */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <ThemedText variant="body" style={styles.loadingTexto}>
              Carregando pedidos...
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refetch}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
          >
            {vendas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyIcone}>🧾</ThemedText>
                <ThemedText variant="subtitle" weight="bold" style={styles.emptyTitulo}>
                  Nenhuma venda registrada
                </ThemedText>
                <ThemedText variant="body" style={styles.emptySubtitulo}>
                  As vendas concluídas no PDV aparecerão aqui em tempo real.
                </ThemedText>
              </View>
            ) : (
              vendas.map((venda) => (
                <CardVendaHistorico
                  key={venda.vendaId}
                  venda={venda}
                  onPress={() => setVendaSelecionada(venda)}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* Modal de Detalhe / Cupom da Venda */}
        <ModalDetalheVenda
          venda={vendaSelecionada}
          visible={vendaSelecionada !== null}
          onClose={() => setVendaSelecionada(null)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
  },
  btnVoltar: {
    padding: 8,
    marginRight: 8,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setaVoltar: {
    color: tokens.colors.textPrimary,
    fontSize: 22,
  },
  tituloBox: {
    flex: 1,
  },
  titulo: {
    color: tokens.colors.textPrimary,
  },
  subtitulo: {
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  faturamentoBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radii.md,
  },
  faturamentoValor: {
    color: '#2E7D32',
    fontSize: 13,
  },
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTexto: {
    marginTop: 12,
    color: tokens.colors.textSecondary,
  },
  emptyContainer: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcone: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitulo: {
    color: tokens.colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitulo: {
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
