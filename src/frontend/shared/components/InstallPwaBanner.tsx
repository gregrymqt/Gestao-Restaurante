import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { usePwaInstall } from '../hooks/usePwaInstall';

export interface InstallPwaBannerProps {
  variant?: 'pill' | 'card';
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/**
 * Botão/Card visual de instalação PWA com degradação graciosa:
 * permanece oculto quando não há suporte de instalação ou em execução standalone.
 */
export function InstallPwaBanner({ variant = 'card' }: InstallPwaBannerProps) {
  const { canInstall, isInstalling, isInstalled, triggerInstall } = usePwaInstall();

  if (!canInstall || isInstalled) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Instalar aplicativo Restaurante Inteligente"
        accessibilityState={{ disabled: isInstalling }}
        hitSlop={HIT_SLOP}
        onPress={() => {
          void triggerInstall();
        }}
        style={({ pressed }) => [styles.pillButton, pressed && styles.pressed]}
      >
        <Ionicons name="download-outline" size={16} color={tokens.colors.primaryDark} />
        <ThemedText variant="caption" weight="bold" color={tokens.colors.primaryDark}>
          {isInstalling ? 'Instalando...' : 'Instalar App'}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Instalar aplicativo na tela inicial"
      accessibilityState={{ disabled: isInstalling }}
      onPress={() => {
        void triggerInstall();
      }}
      style={({ pressed }) => [styles.cardContainer, pressed && styles.pressed]}
    >
      <View style={styles.cardIconBox}>
        <Ionicons name="download-outline" size={20} color={tokens.colors.white} />
      </View>
      <View style={styles.cardTextBox}>
        <ThemedText variant="subtitle" weight="bold" color={tokens.colors.textPrimary}>
          Instalar Aplicativo
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Atalho rápido na tela inicial em tela cheia
        </ThemedText>
      </View>
      <View style={styles.cardBadge}>
        <ThemedText variant="caption" weight="bold" color={tokens.colors.primaryDark}>
          {isInstalling ? '...' : 'Instalar'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginTop: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs + 2,
    minHeight: 38,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    minHeight: 60,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.primaryLight,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBox: {
    flex: 1,
  },
  cardBadge: {
    paddingHorizontal: tokens.spacing.sm + 2,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 999,
    backgroundColor: tokens.colors.primaryLight,
  },
  pressed: {
    opacity: 0.78,
  },
});
