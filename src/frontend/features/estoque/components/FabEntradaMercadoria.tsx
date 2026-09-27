import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface FabEntradaMercadoriaProps {
  onPress: () => void;
}

export function FabEntradaMercadoria({ onPress }: FabEntradaMercadoriaProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.fab}
      accessibilityRole="button"
      accessibilityLabel="Registrar entrada de mercadoria"
    >
      <ThemedText style={styles.fabIcon}>+</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: tokens.spacing.md + 4,
    bottom: tokens.spacing.md + 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 100,
  },
  fabIcon: {
    color: tokens.colors.white,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});
