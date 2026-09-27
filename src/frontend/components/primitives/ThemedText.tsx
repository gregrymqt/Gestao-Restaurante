import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { tokens } from './tokens';

export interface ThemedTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'price' | 'badge';
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function ThemedText({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...rest
}: ThemedTextProps) {
  const getStyleForVariant = () => {
    switch (variant) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'price':
        return styles.price;
      case 'caption':
        return styles.caption;
      case 'badge':
        return styles.badge;
      case 'body':
      default:
        return styles.body;
    }
  };

  const resolvedColor = color ? { color } : undefined;
  const resolvedFontWeight: TextStyle['fontWeight'] | undefined =
    weight === 'semibold'
      ? '600'
      : weight === 'bold'
      ? '700'
      : weight === 'medium'
      ? '500'
      : weight === 'normal'
      ? '400'
      : undefined;

  const resolvedWeight = resolvedFontWeight ? { fontWeight: resolvedFontWeight } : undefined;

  return (
    <Text style={[getStyleForVariant(), resolvedColor, resolvedWeight, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  subtitle: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  body: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '400',
    color: tokens.colors.textSecondary,
  },
  price: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  caption: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '400',
    color: tokens.colors.textMuted,
  },
  badge: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '600',
  },
});
