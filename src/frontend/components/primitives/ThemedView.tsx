import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { tokens } from './tokens';

export interface ThemedViewProps extends ViewProps {
  variant?: 'screen' | 'card' | 'row' | 'badge';
}

export function ThemedView({ variant = 'screen', style, children, ...rest }: ThemedViewProps) {
  const getStyleForVariant = () => {
    switch (variant) {
      case 'card':
        return styles.card;
      case 'row':
        return styles.row;
      case 'badge':
        return styles.badge;
      case 'screen':
      default:
        return styles.screen;
    }
  };

  return (
    <View style={[getStyleForVariant(), style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.full,
    alignSelf: 'flex-start',
  },
});
