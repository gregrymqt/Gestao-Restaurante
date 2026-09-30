import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface AtalhosOperacionaisGridProps {
  onNavegarEstoque: () => void;
  onNavegarCaixa: () => void;
  onNavegarPrevisoes: () => void;
  onAbrirPdvTeste: () => void;
}

export function AtalhosOperacionaisGrid({
  onNavegarEstoque,
  onNavegarCaixa,
  onNavegarPrevisoes,
  onAbrirPdvTeste,
}: AtalhosOperacionaisGridProps) {
  const atalhos = [
    {
      id: 'atalho-estoque',
      titulo: 'Estoque & Ficha',
      descricao: 'Saldo e baixas BOM',
      icone: '📦',
      onPress: onNavegarEstoque,
    },
    {
      id: 'atalho-caixa',
      titulo: 'Auditoria de Caixa',
      descricao: 'Conferência e turno',
      icone: '🔒',
      onPress: onNavegarCaixa,
    },
    {
      id: 'atalho-previsoes',
      titulo: 'Previsões com IA',
      descricao: 'Sugestões de compra',
      icone: '🤖',
      onPress: onNavegarPrevisoes,
    },
    {
      id: 'atalho-pdv',
      titulo: 'Simulador PDV',
      descricao: 'Testar venda balcão',
      icone: '🛒',
      onPress: onAbrirPdvTeste,
    },
  ];

  return (
    <View style={styles.container}>
      <ThemedText variant="caption" weight="bold" style={styles.tituloSecao}>
        ACESSO RÁPIDO OPERACIONAL
      </ThemedText>

      <View style={styles.grid}>
        {atalhos.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.titulo}
            onPress={item.onPress}
            style={({ pressed }) => [styles.cardAtalho, pressed && styles.cardPressionado]}
          >
            <ThemedText style={styles.icone}>{item.icone}</ThemedText>
            <ThemedText variant="caption" weight="bold" style={styles.titulo}>
              {item.titulo}
            </ThemedText>
            <ThemedText variant="caption" style={styles.descricao}>
              {item.descricao}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  tituloSecao: {
    color: tokens.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: tokens.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  cardAtalho: {
    width: '48%',
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    alignItems: 'flex-start',
  },
  cardPressionado: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  icone: {
    fontSize: 22,
    marginBottom: 6,
  },
  titulo: {
    color: tokens.colors.textPrimary,
    marginBottom: 2,
  },
  descricao: {
    color: tokens.colors.textMuted,
    fontSize: 10,
  },
});
