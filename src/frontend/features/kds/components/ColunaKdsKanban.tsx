import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { PedidoKds, StatusPreparoKds } from '../types';
import { TicketKdsCard } from './TicketKdsCard';

interface ColunaKdsKanbanProps {
  titulo: string;
  corIndicador: string;
  pedidos: readonly PedidoKds[];
  agoraMs: number;
  pedidoEmAtualizacaoId: string | null;
  onAvancarStatus: (vendaId: string, proximoStatus: StatusPreparoKds) => void;
}

export function ColunaKdsKanban({
  titulo,
  corIndicador,
  pedidos,
  agoraMs,
  pedidoEmAtualizacaoId,
  onAvancarStatus,
}: ColunaKdsKanbanProps) {
  return (
    <View style={styles.coluna}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: corIndicador }]} />
          <ThemedText variant="subtitle" weight="bold" style={styles.titulo}>
            {titulo}
          </ThemedText>
        </View>
        <View style={[styles.contador, { backgroundColor: corIndicador }]}>
          <ThemedText variant="caption" weight="bold" style={styles.contadorText}>
            {pedidos.length}
          </ThemedText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.lista}>
        {pedidos.length === 0 ? (
          <View style={styles.vazioBox}>
            <ThemedText variant="caption" style={styles.vazioTexto}>
              Nenhum pedido nesta etapa
            </ThemedText>
          </View>
        ) : (
          pedidos.map((pedido) => (
            <TicketKdsCard
              key={pedido.vendaId}
              pedido={pedido}
              agoraMs={agoraMs}
              isProcessando={pedidoEmAtualizacaoId === pedido.vendaId}
              onAvancarStatus={onAvancarStatus}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  coluna: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  titulo: {
    fontSize: 16,
    color: tokens.colors.textPrimary,
  },
  contador: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  contadorText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  lista: {
    padding: tokens.spacing.md,
  },
  vazioBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  vazioTexto: {
    color: tokens.colors.textSecondary,
  },
});
