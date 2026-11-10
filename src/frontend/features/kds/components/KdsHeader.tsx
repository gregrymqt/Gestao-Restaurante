import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface KdsHeaderProps {
  totalAtivos: number;
  isAtualizando: boolean;
  onVoltar: () => void;
  onRecarregar: () => void;
}

export function KdsHeader({ totalAtivos, isAtualizando, onVoltar, onRecarregar }: KdsHeaderProps) {
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
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <ThemedText variant="caption" weight="bold" style={styles.liveText}>
                Live
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
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={onRecarregar}
        style={({ pressed }) => [styles.btnRefresh, pressed && styles.pressed]}
      >
        <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
          {isAtualizando ? '...' : '↻ Atualizar'}
        </ThemedText>
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
    paddingHorizontal: tokens.spacing.sm + 4,
    paddingVertical: tokens.spacing.xs + 4,
    borderRadius: tokens.radii.md,
    backgroundColor: '#FFF5F2',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  pressed: {
    opacity: 0.7,
  },
});
