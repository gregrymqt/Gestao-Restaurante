import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface FichaTecnicaFinanceGridProps {
  custoInsumos: number;
  precoBalcao: number;
  margemBrutaPercentual: number;
}

export function FichaTecnicaFinanceGrid({
  custoInsumos,
  precoBalcao,
  margemBrutaPercentual,
}: FichaTecnicaFinanceGridProps) {
  return (
    <View style={styles.financeGrid}>
      <View style={styles.financeItem}>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Custo Insumos
        </ThemedText>
        <ThemedText variant="body" style={styles.financeValor}>
          R$ {custoInsumos.toFixed(2).replace('.', ',')}
        </ThemedText>
      </View>

      <View style={styles.financeDivider} />

      <View style={styles.financeItem}>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Preço Balcão
        </ThemedText>
        <ThemedText variant="body" style={styles.financeValor}>
          R$ {precoBalcao.toFixed(2).replace('.', ',')}
        </ThemedText>
      </View>

      <View style={styles.financeDivider} />

      <View style={styles.financeItem}>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Margem Bruta
        </ThemedText>
        <ThemedText variant="body" style={styles.margemValor}>
          {margemBrutaPercentual.toFixed(1)}%
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  financeGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  financeItem: {
    flex: 1,
    alignItems: 'center',
  },
  financeDivider: {
    width: 1,
    backgroundColor: tokens.colors.border,
    marginVertical: 2,
  },
  financeValor: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  margemValor: {
    fontWeight: '800',
    color: tokens.colors.status.greenText,
    marginTop: 2,
  },
});
