import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { SugestaoReposicaoInsumo } from '../types';

interface OrdemCompraItemRowProps {
  item: SugestaoReposicaoInsumo;
  isChecked: boolean;
  onToggle: (insumoId: string) => void;
}

export function OrdemCompraItemRow({
  item,
  isChecked,
  onToggle,
}: OrdemCompraItemRowProps) {
  const subtotal = item.quantidadeComprar * (item.precoEstimadoUnitario || 35.0);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onToggle(item.insumoId)}
      style={[styles.itemRow, isChecked && styles.itemRowActive]}
    >
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
      </View>

      <View style={styles.itemInfo}>
        <ThemedText variant="body" style={styles.itemNome}>
          {item.nomeInsumo}
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Qtd Sugerida: +{item.quantidadeComprar} {item.unidadeMedida} (Atual: {item.stockAtual} {item.unidadeMedida})
        </ThemedText>
      </View>

      <View style={styles.precoCol}>
        <ThemedText variant="body" style={styles.subtotalTexto}>
          R$ {subtotal.toFixed(2).replace('.', ',')}
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          R$ {(item.precoEstimadoUnitario || 35.0).toFixed(2)}/{item.unidadeMedida}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: '#FAFAFA',
    marginBottom: tokens.spacing.xs,
  },
  itemRowActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#FFF9F8',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  checkmark: {
    color: tokens.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontWeight: '700',
  },
  precoCol: {
    alignItems: 'flex-end',
  },
  subtotalTexto: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
});
