import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

export const CATEGORIAS_PADRAO = [
  'Proteínas / Carnes',
  'Panificação',
  'Laticínios',
  'Hortifrúti',
  'Bebidas / Embalagens',
  'Geral / Mercearia',
];

export const UNIDADES_PADRAO = ['UN', 'KG', 'L', 'G'];

interface ModalNovoInsumoPillsProps {
  categoria: string;
  onSelectCategoria: (categoria: string) => void;
  unidadeMedida: string;
  onSelectUnidadeMedida: (un: string) => void;
}

export function ModalNovoInsumoPills({
  categoria,
  onSelectCategoria,
  unidadeMedida,
  onSelectUnidadeMedida,
}: ModalNovoInsumoPillsProps) {
  return (
    <>
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Categoria</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {CATEGORIAS_PADRAO.map((cat) => {
            const isSelected = categoria === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onSelectCategoria(cat)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Unidade de Medida *</ThemedText>
        <View style={styles.rowPills}>
          {UNIDADES_PADRAO.map((un) => {
            const isSelected = unidadeMedida === un;
            return (
              <TouchableOpacity
                key={un}
                style={[styles.unPill, isSelected && styles.unPillSelected]}
                onPress={() => onSelectUnidadeMedida(un)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.unPillText, isSelected && styles.unPillTextSelected]}>
                  {un}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: 6,
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  pill: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  pillText: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
  rowPills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  unPill: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  unPillSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  unPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  unPillTextSelected: {
    color: tokens.colors.white,
  },
});
