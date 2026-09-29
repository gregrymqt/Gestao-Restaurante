import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { CategoriaProduto } from '../types';

export const CATEGORIAS_PRODUTO: CategoriaProduto[] = [
  'Hambúrgueres',
  'Porções',
  'Bebidas',
  'Sobremesas',
];

interface ModalNovoProdutoCategoriasProps {
  categoriaSelecionada: CategoriaProduto;
  onSelectCategoria: (categoria: CategoriaProduto) => void;
}

export function ModalNovoProdutoCategorias({
  categoriaSelecionada,
  onSelectCategoria,
}: ModalNovoProdutoCategoriasProps) {
  return (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>Categoria *</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
        {CATEGORIAS_PRODUTO.map((cat) => {
          const isSelected = categoriaSelecionada === cat;
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
});
