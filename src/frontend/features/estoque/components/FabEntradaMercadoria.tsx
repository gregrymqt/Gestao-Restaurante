import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';

interface FabEntradaMercadoriaProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FabEntradaMercadoria({
  onPress,
  accessibilityLabel = 'Cadastrar novo item',
}: FabEntradaMercadoriaProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.fab}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Plus size={26} color={tokens.colors.white} strokeWidth={2.5} />
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
    ...createShadow({
      color: tokens.colors.primary,
      offsetY: 4,
      radius: 6,
      opacity: 0.35,
      elevation: 6,
    }),
    zIndex: 100,
  },
});
