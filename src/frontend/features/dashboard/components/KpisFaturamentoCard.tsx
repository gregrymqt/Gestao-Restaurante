import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { KpisFaturamento } from '../types';

interface KpisFaturamentoCardProps {
  kpis: KpisFaturamento;
}

export function KpisFaturamentoCard({ kpis }: KpisFaturamentoCardProps) {
  const isMetaPositiva = kpis.percentualMeta >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <ThemedText variant="caption" weight="bold" color={tokens.colors.textMuted}>
          FATURAMENTO DO DIA (CONSOLIDADO)
        </ThemedText>
        <View style={[styles.badgeMeta, isMetaPositiva ? styles.badgeMetaPositiva : styles.badgeMetaNegativa]}>
          <ThemedText
            variant="caption"
            weight="bold"
            color={isMetaPositiva ? tokens.colors.status.greenText : tokens.colors.status.redText}
          >
            {isMetaPositiva ? '📈 +' : '📉 '}
            {kpis.percentualMeta.toFixed(1)}% vs meta
          </ThemedText>
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
    </View>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  badgeMeta: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
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
    color: tokens.colors.primary,
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
