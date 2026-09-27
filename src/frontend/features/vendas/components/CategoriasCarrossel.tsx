import React from 'react';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { CategoriaProduto } from '../types';

interface CategoriasCarrosselProps {
  categoriaSelecionada: CategoriaProduto;
  aoSelecionarCategoria: (categoria: CategoriaProduto) => void;
}

const CATEGORIAS: CategoriaProduto[] = [
  'Todos',
  'Hambúrgueres',
  'Porções',
  'Bebidas',
  'Sobremesas',
];

export function CategoriasCarrossel({
  categoriaSelecionada,
  aoSelecionarCategoria,
}: CategoriasCarrosselProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIAS.map((cat) => {
          const isAtivo = cat === categoriaSelecionada;

          return (
            <Pressable
              key={cat}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por categoria ${cat}`}
              accessibilityState={{ selected: isAtivo }}
              style={[
                styles.pill,
                isAtivo ? styles.pillAtivo : styles.pillInativo,
              ]}
              onPress={() => aoSelecionarCategoria(cat)}
            >
              <ThemedText
                variant="subtitle"
                style={[
                  styles.pillText,
                  isAtivo ? styles.pillTextAtivo : styles.pillTextInativo,
                ]}
              >
                {cat}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingVertical: tokens.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    height: 48,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  pillAtivo: {
    backgroundColor: tokens.colors.primary,
  },
  pillInativo: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  pillText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '600',
  },
  pillTextAtivo: {
    color: tokens.colors.white,
  },
  pillTextInativo: {
    color: tokens.colors.textSecondary,
  },
});
