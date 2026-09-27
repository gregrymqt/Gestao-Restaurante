import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { IngredienteFicha } from '../types';

interface FichaTecnicaIngredientesPillsProps {
  ingredientes: IngredienteFicha[];
  tituloSecao?: string;
  exibirQuantidade?: boolean;
}

export function FichaTecnicaIngredientesPills({
  ingredientes,
  tituloSecao = 'COMPOSIÇÃO DO ITEM',
  exibirQuantidade = false,
}: FichaTecnicaIngredientesPillsProps) {
  return (
    <View style={styles.composicaoSection}>
      <ThemedText variant="caption" style={styles.composicaoTitulo}>
        {tituloSecao}
      </ThemedText>

      <View style={styles.pillsWrap}>
        {ingredientes.map((ing) => (
          <View
            key={ing.insumoId}
            style={[
              styles.ingredientePill,
              ing.isGargalo && styles.ingredientePillGargalo,
            ]}
          >
            <View
              style={[
                styles.ingredienteDot,
                {
                  backgroundColor: ing.isGargalo
                    ? tokens.colors.status.redText
                    : tokens.colors.status.greenText,
                },
              ]}
            />
            <ThemedText
              variant="caption"
              style={[
                styles.ingredienteText,
                ing.isGargalo && styles.ingredienteTextGargalo,
              ]}
            >
              {ing.nome}
              {exibirQuantidade && ing.quantidade ? ` (${ing.quantidade})` : ''}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composicaoSection: {
    marginBottom: tokens.spacing.sm,
  },
  composicaoTitulo: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 4,
  },
  ingredientePillGargalo: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: '#F28B82',
  },
  ingredienteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredienteText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  ingredienteTextGargalo: {
    color: tokens.colors.status.redText,
    fontWeight: '700',
  },
});
