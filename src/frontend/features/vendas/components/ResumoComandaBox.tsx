import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

interface ResumoComandaBoxProps {
  totalItens: number;
  subtotal: number;
  nomesResumo: string;
}

export function ResumoComandaBox({
  totalItens,
  subtotal,
  nomesResumo,
}: ResumoComandaBoxProps) {
  return (
    <View style={styles.resumoBox}>
      <View style={styles.resumoEsquerda}>
        <ThemedText variant="subtitle" style={styles.itensContagem}>
          {totalItens} {totalItens === 1 ? 'item selecionado' : 'itens selecionados'}
        </ThemedText>
        <ThemedText
          variant="caption"
          numberOfLines={1}
          style={styles.itensLista}
        >
          {nomesResumo || 'Nenhum item adicionado'}
        </ThemedText>
      </View>

      <View style={styles.resumoDireita}>
        <ThemedText variant="caption" style={styles.labelTotal}>
          TOTAL A PAGAR
        </ThemedText>
        <ThemedText variant="title" style={styles.valorTotal}>
          R$ {subtotal.toFixed(2).replace('.', ',')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resumoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  resumoEsquerda: {
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  itensContagem: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  itensLista: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  resumoDireita: {
    alignItems: 'flex-end',
  },
  labelTotal: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  valorTotal: {
    fontSize: tokens.typography.fontXxl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
});
