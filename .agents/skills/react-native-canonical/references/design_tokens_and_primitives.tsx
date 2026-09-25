// ==============================================================================
// Manual Canónico de React Native: Expo SDK 54+
// Design Tokens Centralizados e Componentes Primitivos Tipados
// ==============================================================================

import React from 'react';
import {
  Text,
  TextProps,
  View,
  ViewProps,
  Pressable,
  PressableProps,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

// ------------------------------------------------------------------------------
// 1. Design Tokens da Plataforma Restaurante Inteligente
// ------------------------------------------------------------------------------
export const ThemeTokens = {
  colors: {
    primary: '#D9381E',      // Vermelho gastronômico vibrante
    primaryDark: '#B32610',
    primaryLight: '#FFECE8',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    textPrimary: '#1C1B1F',
    textSecondary: '#49454F',
    textMuted: '#79747E',
    border: '#E6E0E9',
    success: '#146C2E',
    successBackground: '#DFF6E5',
    warning: '#B54708',
    warningBackground: '#FEF3F2',
    danger: '#B3261E',
    dangerBackground: '#F9DEDC'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999
  }
} as const;

// ------------------------------------------------------------------------------
// 2. Componente ThemedText (Elimina o risco de no-raw-text)
// ------------------------------------------------------------------------------
export type TextVariant = 'display' | 'title' | 'body' | 'caption' | 'price';

export interface ThemedTextProps extends TextProps {
  readonly variant?: TextVariant;
  readonly color?: keyof typeof ThemeTokens.colors;
  readonly children: React.ReactNode;
}

export function ThemedText({
  variant = 'body',
  color = 'textPrimary',
  style,
  children,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.baseText,
        styles[variant],
        { color: ThemeTokens.colors[color] },
        style
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// ------------------------------------------------------------------------------
// 3. Componente ThemedView (Base de Layout com Flexbox Nativo)
// ------------------------------------------------------------------------------
export interface ThemedViewProps extends ViewProps {
  readonly background?: keyof typeof ThemeTokens.colors;
  readonly padding?: keyof typeof ThemeTokens.spacing;
  readonly children?: React.ReactNode;
}

export function ThemedView({
  background = 'background',
  padding,
  style,
  children,
  ...rest
}: ThemedViewProps) {
  return (
    <View
      style={[
        styles.baseView,
        { backgroundColor: ThemeTokens.colors[background] },
        padding ? { padding: ThemeTokens.spacing[padding] } : undefined,
        style
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// ------------------------------------------------------------------------------
// 4. Componente Button Canônico (Acessível, sem inline-styles e com loading)
// ------------------------------------------------------------------------------
export interface ButtonProps extends PressableProps {
  readonly label: string;
  readonly loading?: boolean;
  readonly variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isButtonDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isButtonDisabled, busy: loading }}
      disabled={isButtonDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        styles[`button_${variant}`],
        pressed && !isButtonDisabled && styles.buttonPressed,
        isButtonDisabled && styles.buttonDisabled,
        typeof style === 'function' ? style({ pressed }) : style
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={ThemeTokens.colors.surface} />
      ) : (
        <ThemedText
          variant="title"
          color={variant === 'secondary' ? 'primary' : 'surface'}
          style={styles.buttonLabel}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

// ------------------------------------------------------------------------------
// 5. StyleSheet Canônico (Sem propriedades órfãs)
// ------------------------------------------------------------------------------
const styles = StyleSheet.create({
  baseText: {
    fontSize: 14,
    lineHeight: 20
  },
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700'
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600'
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400'
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400'
  },
  price: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700'
  },
  baseView: {
    flex: 1
  },
  buttonBase: {
    height: 48,
    borderRadius: ThemeTokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ThemeTokens.spacing.md
  },
  button_primary: {
    backgroundColor: ThemeTokens.colors.primary
  },
  button_secondary: {
    backgroundColor: ThemeTokens.colors.primaryLight,
    borderWidth: 1,
    borderColor: ThemeTokens.colors.primary
  },
  button_danger: {
    backgroundColor: ThemeTokens.colors.danger
  },
  buttonPressed: {
    opacity: 0.85
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonLabel: {
    textAlign: 'center'
  }
});
