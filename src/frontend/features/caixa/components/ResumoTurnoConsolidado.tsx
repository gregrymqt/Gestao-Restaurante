import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface ResumoTurnoConsolidadoProps {
  totalApuradoFormatado: string;
  totalVendas: number;
}

export function ResumoTurnoConsolidado({
  totalApuradoFormatado,
  totalVendas,
}: ResumoTurnoConsolidadoProps) {
  return (
    <View style={styles.resumoBox}>
      <View style={styles.resumoItem}>
        <ThemedText variant="caption" style={styles.labelResumo}>
          TOTAL APURADO
        </ThemedText>
        <ThemedText variant="title" style={styles.valorResumoDestaque}>
          {totalApuradoFormatado}
        </ThemedText>
      </View>

      <View style={styles.resumoDivisor} />

      <View style={styles.resumoItem}>
        <ThemedText variant="caption" style={styles.labelResumo}>
          VENDAS CONSOLIDADAS
        </ThemedText>
        <ThemedText variant="subtitle" style={styles.valorResumo}>
          {totalVendas} transações
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resumoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  resumoItem: {
    flex: 1,
  },
  labelResumo: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  valorResumoDestaque: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  valorResumo: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  resumoDivisor: {
    width: 1,
    height: 36,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.md,
  },
});
