import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { SugestaoReposicaoInsumo } from '../types';

interface OrdemCompraItemRowProps {
  item: SugestaoReposicaoInsumo;
  isChecked: boolean;
  qtdOverride?: number;
  onToggle: (insumoId: string) => void;
  onChangeQtd: (insumoId: string, novaQtd: number) => void;
}

export function OrdemCompraItemRow({
  item,
  isChecked,
  qtdOverride,
  onToggle,
  onChangeQtd,
}: OrdemCompraItemRowProps) {
  const qtdEfetiva = qtdOverride ?? item.quantidadeComprar;
  const subtotal = qtdEfetiva * (item.precoEstimadoUnitario || 35.0);
  const novoSaldo = item.stockAtual + qtdEfetiva;

  const formatQtd = (val: number) =>
    Number.isInteger(val) ? val.toString() : val.toFixed(1);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onToggle(item.insumoId)}
      style={[
        styles.itemRow,
        isChecked ? styles.itemRowActive : styles.itemRowInactive,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      accessibilityLabel={`${item.nomeInsumo}, subtotal ${formatarMoeda(subtotal)}`}
    >
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
      </View>

      <View style={styles.itemInfo}>
        <ThemedText variant="body" style={styles.itemNome} numberOfLines={1}>
          {item.nomeInsumo}
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          {formatQtd(item.stockAtual)} {item.unidadeMedida} → {formatQtd(novoSaldo)} {item.unidadeMedida}
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          {formatarMoeda(item.precoEstimadoUnitario || 35.0)}/{item.unidadeMedida}
        </ThemedText>
      </View>

      <View style={styles.rightCol}>
        <ThemedText variant="body" style={styles.subtotalTexto}>
          {formatarMoeda(subtotal)}
        </ThemedText>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => onChangeQtd(item.insumoId, Math.max(1, qtdEfetiva - 1))}
            disabled={!isChecked || qtdEfetiva <= 1}
            style={[
              styles.stepperBtn,
              (!isChecked || qtdEfetiva <= 1) && styles.stepperBtnDisabled,
            ]}
            accessibilityLabel="Diminuir quantidade"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={styles.stepperSymbol}>−</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.stepperValue}>{qtdEfetiva}</ThemedText>

          <TouchableOpacity
            onPress={() => onChangeQtd(item.insumoId, Math.min(999, qtdEfetiva + 1))}
            disabled={!isChecked || qtdEfetiva >= 999}
            style={[
              styles.stepperBtn,
              (!isChecked || qtdEfetiva >= 999) && styles.stepperBtnDisabled,
            ]}
            accessibilityLabel="Aumentar quantidade"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={styles.stepperSymbol}>+</ThemedText>
          </TouchableOpacity>
        </View>
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
    borderColor: '#1A1A1A',
    backgroundColor: '#F9F4FF',
  },
  itemRowInactive: {
    opacity: 0.55,
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
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  checkmark: {
    color: tokens.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
    paddingRight: tokens.spacing.xs,
  },
  itemNome: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  subtotalTexto: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: 2,
    gap: 4,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    lineHeight: 20,
  },
  stepperValue: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
});
