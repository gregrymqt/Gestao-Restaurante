import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface OperadorModeToggleProps {
  isOperadorMode: boolean;
  onToggle: () => void;
}

export function OperadorModeToggle({
  isOperadorMode,
  onToggle,
}: OperadorModeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={styles.toggleButton}
        accessibilityRole="button"
        accessibilityLabel="Alternar entre modo gestor e operador de caixa"
      >
        <Ionicons
          name={isOperadorMode ? 'business-outline' : 'calculator-outline'}
          size={16}
          color={tokens.colors.primaryDark}
        />
        <ThemedText variant="caption" weight="bold" color={tokens.colors.primaryDark}>
          {isOperadorMode
            ? 'Voltar ao Acesso do Gestor'
            : 'É operador de PDV? Acessar Frente de Caixa'}
        </ThemedText>
        <Ionicons
          name={isOperadorMode ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={tokens.colors.primaryDark}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primaryLight,
  },
});
