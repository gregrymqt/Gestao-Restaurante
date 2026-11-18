import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface AtalhosOperacionaisGridProps {
  onNavegarCaixa: () => void;
}

export function AtalhosOperacionaisGrid({
  onNavegarCaixa,
}: AtalhosOperacionaisGridProps) {
  const atalhos = [
    {
      id: 'atalho-caixa',
      titulo: 'Auditoria de Caixa',
      descricao: 'Conferência de sangrias e turno',
      icone: 'lock-closed' as const,
      onPress: onNavegarCaixa,
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
            <View style={styles.conteudoEsquerda}>
              <View style={styles.iconeWrapper}>
                <Ionicons name={item.icone} size={18} color={tokens.colors.primary} />
              </View>
              <View style={styles.textos}>
                <ThemedText variant="body" weight="bold" style={styles.titulo}>
                  {item.titulo}
                </ThemedText>
                <ThemedText variant="caption" style={styles.descricao}>
                  {item.descricao}
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.colors.textMuted} />
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
    width: '100%',
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPressionado: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  conteudoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  iconeWrapper: {
    width: 36,
    height: 36,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  titulo: {
    color: tokens.colors.textPrimary,
    fontSize: 13,
    lineHeight: 16,
  },
  descricao: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
});
