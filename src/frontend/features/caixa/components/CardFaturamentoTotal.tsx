import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

interface CardFaturamentoTotalProps {
  totalApurado: number;
  percentualMeta: number;
  totalVendas: number;
  ticketMedio: number;
}

export function CardFaturamentoTotal({
  totalApurado,
  percentualMeta,
  totalVendas,
  ticketMedio,
}: CardFaturamentoTotalProps) {
  const isMetaPositiva = percentualMeta >= 0;

  return (
    <View style={styles.card}>
      {/* Header do Card com Label e Badge de Meta */}
      <View style={styles.headerRow}>
        <ThemedText variant="caption" weight="bold" style={styles.labelFaturamento}>
          TOTAL APURADO NO TURNO
        </ThemedText>

        <View
          style={[
            styles.badgeMeta,
            isMetaPositiva ? styles.badgeMetaPositiva : styles.badgeMetaNegativa,
          ]}
        >
          <ThemedText
            variant="caption"
            weight="bold"
            color={
              isMetaPositiva
                ? tokens.colors.status.greenText
                : tokens.colors.status.redText
            }
          >
            {isMetaPositiva ? '📈 +' : '📉 '}
            {percentualMeta.toFixed(1)}% vs meta
          </ThemedText>
        </View>
      </View>

      {/* Valor Total em Destaque */}
      <View style={styles.valorContainer}>
        <ThemedText variant="title" style={styles.cifrao}>
          R${' '}
        </ThemedText>
        <ThemedText variant="title" style={styles.valorGrande}>
          {totalApurado.toFixed(2).replace('.', ',')}
        </ThemedText>
      </View>

      {/* Submétricas em Caixas Lado a Lado */}
      <View style={styles.submetricasRow}>
        {/* Submétrica 1: Transações */}
        <View style={styles.submetricaCard}>
          <View style={styles.iconeWrapper}>
            <ThemedText variant="title">🧾</ThemedText>
          </View>
          <View style={styles.submetricaCol}>
            <ThemedText variant="caption" style={styles.submetricaLabel}>
              Transações
            </ThemedText>
            <ThemedText variant="subtitle" style={styles.submetricaValor}>
              {totalVendas} vendas
            </ThemedText>
          </View>
        </View>

        {/* Submétrica 2: Ticket Médio */}
        <View style={styles.submetricaCard}>
          <View style={styles.iconeWrapper}>
            <ThemedText variant="title">📊</ThemedText>
          </View>
          <View style={styles.submetricaCol}>
            <ThemedText variant="caption" style={styles.submetricaLabel}>
              Ticket Médio
            </ThemedText>
            <ThemedText variant="subtitle" style={styles.submetricaValor}>
              R$ {ticketMedio.toFixed(2).replace('.', ',')}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#FCE8E6',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.lg,
    marginVertical: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  labelFaturamento: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  badgeMeta: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  badgeMetaPositiva: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  badgeMetaNegativa: {
    backgroundColor: tokens.colors.status.redBg,
  },
  valorContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: tokens.spacing.lg,
  },
  cifrao: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  valorGrande: {
    fontSize: 34,
    fontWeight: '900',
    color: tokens.colors.textPrimary,
    lineHeight: 40,
  },
  submetricasRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  submetricaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  iconeWrapper: {
    width: 32,
    height: 32,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submetricaCol: {
    flex: 1,
  },
  submetricaLabel: {
    fontSize: 10,
    color: tokens.colors.textMuted,
  },
  submetricaValor: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
});
