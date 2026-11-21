import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface EmptyStateTenantsProps {
  busca: string;
  statusFiltro: string;
  onLimparFiltros: () => void;
}

export function EmptyStateTenants({
  busca,
  statusFiltro,
  onLimparFiltros,
}: EmptyStateTenantsProps) {
  const temFiltroAtivo = busca.trim().length > 0 || statusFiltro !== 'TODOS';

  return (
    <View style={styles.container}>
      <View style={styles.iconeCirculo}>
        <ThemedText style={styles.iconeTexto}>🔍</ThemedText>
      </View>

      <ThemedText variant="subtitle" weight="bold" style={styles.titulo}>
        Nenhum inquilino encontrado
      </ThemedText>

      <ThemedText variant="caption" style={styles.descricao}>
        {temFiltroAtivo
          ? 'Não encontramos lojas para os termos e status filtrados. Tente ajustar a busca.'
          : 'Nenhum inquilino cadastrado na plataforma até o momento.'}
      </ThemedText>

      {temFiltroAtivo && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar todos os filtros de busca"
          onPress={onLimparFiltros}
          style={({ pressed }) => [styles.botaoLimpar, pressed && styles.pressed]}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            ✕ Limpar Filtros
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  iconeTexto: {
    fontSize: 28,
  },
  titulo: {
    fontSize: 16,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  descricao: {
    color: tokens.colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: tokens.spacing.md,
    lineHeight: 18,
  },
  botaoLimpar: {
    paddingVertical: 8,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
