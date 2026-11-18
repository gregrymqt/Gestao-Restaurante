import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { KpisFaturamento } from '../types';

interface KpisFaturamentoCardProps {
  kpis: KpisFaturamento;
  onPress?: () => void;
}

export function KpisFaturamentoCard({ kpis, onPress }: KpisFaturamentoCardProps) {
  const isMetaPositiva = kpis.percentualMeta >= 0;

  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress
    ? {
        onPress,
        accessibilityRole: 'button' as const,
        accessibilityLabel: 'Ver histórico de vendas do dia',
        style: ({ pressed }: { pressed: boolean }) => [
          styles.card,
          pressed && styles.cardPressed,
        ],
      }
    : { style: styles.card };

  return (
    <Wrapper {...wrapperProps}>
      <View style={styles.topo}>
        <View style={styles.tituloRow}>
          <ThemedText variant="caption" weight="bold" color={tokens.colors.textMuted} numberOfLines={1}>
            FATURAMENTO DO DIA
          </ThemedText>
          <Ionicons name="chevron-forward" size={13} color={tokens.colors.textMuted} />
        </View>
        <View style={[styles.badgeMeta, isMetaPositiva ? styles.badgeMetaPositiva : styles.badgeMetaNegativa]}>
          <View style={styles.badgeMetaContent}>
            <Ionicons
              name={isMetaPositiva ? 'trending-up' : 'trending-down'}
              size={12}
              color={isMetaPositiva ? tokens.colors.status.greenText : tokens.colors.status.redText}
            />
            <ThemedText
              variant="caption"
              weight="bold"
              color={isMetaPositiva ? tokens.colors.status.greenText : tokens.colors.status.redText}
            >
              {isMetaPositiva ? '+' : ''}
              {kpis.percentualMeta.toFixed(1)}% vs meta
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.valorLinha}>
        <ThemedText variant="title" style={styles.cifrao}>
          R$
        </ThemedText>
        <ThemedText variant="title" style={styles.valorGrande}>
          {kpis.totalFaturadoDia.toFixed(2).replace('.', ',')}
        </ThemedText>
      </View>

      <View style={styles.gradeMetricas}>
        <View style={styles.metricaItem}>
          <ThemedText variant="caption" style={styles.labelMetrica}>
            PEDIDOS HOJE
          </ThemedText>
          <ThemedText variant="subtitle" weight="bold">
            {kpis.quantidadePedidos} vendas
          </ThemedText>
        </View>

        <View style={styles.divisorVertical} />

        <View style={styles.metricaItem}>
          <ThemedText variant="caption" style={styles.labelMetrica}>
            TICKET MÉDIO
          </ThemedText>
          <ThemedText variant="subtitle" weight="bold">
            R$ {kpis.ticketMedio.toFixed(2).replace('.', ',')}
          </ThemedText>
        </View>

        <View style={styles.divisorVertical} />

        <View style={styles.metricaItem}>
          <ThemedText variant="caption" style={styles.labelMetrica}>
            ONTEM
          </ThemedText>
          <ThemedText variant="subtitle" weight="bold" color={tokens.colors.textSecondary}>
            R$ {kpis.faturamentoOntem.toFixed(2).replace('.', ',')}
          </ThemedText>
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    backgroundColor: '#F5F5F5',
    opacity: 0.95,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
    gap: tokens.spacing.xs,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: tokens.spacing.xs,
  },
  badgeMeta: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    flexShrink: 0,
  },
  badgeMetaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeMetaPositiva: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  badgeMetaNegativa: {
    backgroundColor: tokens.colors.status.redBg,
  },
  valorLinha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: tokens.spacing.md,
  },
  cifrao: {
    fontSize: tokens.typography.fontXl,
    color: tokens.colors.textPrimary,
  },
  valorGrande: {
    fontSize: 32,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  gradeMetricas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.md,
  },
  metricaItem: {
    flex: 1,
    alignItems: 'center',
  },
  labelMetrica: {
    fontSize: 10,
    color: tokens.colors.textMuted,
    marginBottom: 2,
  },
  divisorVertical: {
    width: 1,
    height: 28,
    backgroundColor: tokens.colors.border,
  },
});
