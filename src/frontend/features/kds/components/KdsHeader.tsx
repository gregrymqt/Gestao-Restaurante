import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import type { SseConnectionState } from '@/shared/types/sse.types';

interface KdsHeaderProps {
  totalAtivos: number;
  isAtualizando: boolean;
  sseStatus: SseConnectionState;
  onVoltar: () => void;
  onRecarregar: () => void;
}

export function KdsHeader({
  totalAtivos,
  isAtualizando,
  sseStatus,
  onVoltar,
  onRecarregar,
}: KdsHeaderProps) {
  const isConnected = sseStatus === 'CONNECTED';
  const isReconnecting = sseStatus === 'RECONNECTING' || sseStatus === 'CONNECTING';

  const liveColor = isConnected ? '#16A34A' : isReconnecting ? '#D97706' : '#DC2626';
  const liveBg = isConnected ? '#DCFCE7' : isReconnecting ? '#FEF3C7' : '#FEE2E2';
  const liveLabel = isConnected ? 'Live' : isReconnecting ? 'Sync...' : 'Offline';

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar do painel da cozinha"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={onVoltar}
          style={({ pressed }) => [styles.btnVoltar, pressed && styles.pressed]}
        >
          <ThemedText variant="subtitle" weight="bold" color={tokens.colors.textPrimary}>
            ←
          </ThemedText>
        </Pressable>

        <View>
          <View style={styles.titleRow}>
            <ThemedText variant="subtitle" weight="bold" style={styles.title}>
              KDS • Cozinha
            </ThemedText>
            <View style={[styles.livePill, { backgroundColor: liveBg }]}>
              <View style={[styles.liveDot, { backgroundColor: liveColor }]} />
              <ThemedText variant="caption" weight="bold" style={[styles.liveText, { color: liveColor }]}>
                {liveLabel}
              </ThemedText>
            </View>
          </View>
          <ThemedText variant="caption" style={styles.subtitle}>
            {totalAtivos} {totalAtivos === 1 ? 'pedido em fila' : 'pedidos em fila'} • Ordem FIFO
          </ThemedText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Atualizar pedidos da cozinha"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onRecarregar}
        style={({ pressed }) => [styles.btnRefresh, pressed && styles.pressed]}
      >
        {isAtualizando ? (
          <ActivityIndicator size="small" color={tokens.colors.primary} />
        ) : (
          <Ionicons name="refresh" size={18} color={tokens.colors.primary} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm + 2,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm + 2,
  },
  btnVoltar: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs + 2,
  },
  title: {
    fontSize: 18,
    color: tokens.colors.textPrimary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 11,
    color: '#15803D',
  },
  subtitle: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
  },
  btnRefresh: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radii.md,
    backgroundColor: '#FFF5F2',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  pressed: {
    opacity: 0.7,
  },
});
