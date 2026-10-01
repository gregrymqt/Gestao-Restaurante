import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { useSseStatus } from '../hooks/useSseStatus';

export function RealtimeEventToast() {
  const insets = useSafeAreaInsets();
  const activeToast = useSseStatus((state) => state.activeToast);
  const clearToast = useSseStatus((state) => state.clearToast);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (activeToast) {
      // Animação de entrada
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver,
          bounciness: 6,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver,
        }),
      ]).start();

      // Temporizador de auto-dispensa (6 segundos)
      timerRef.current = setTimeout(() => {
        dismissToast();
      }, 6000);
    } else {
      translateY.setValue(-120);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeToast]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver,
      }),
    ]).start(() => {
      clearToast();
    });
  };

  if (!activeToast) return null;

  const isCritico = activeToast.tipo === 'critico';
  const isSucesso = activeToast.tipo === 'sucesso';

  const borderColor = isCritico
    ? tokens.colors.status.redText
    : isSucesso
    ? tokens.colors.status.greenText
    : '#0284C7';

  const bgColor = isCritico
    ? tokens.colors.status.redBg
    : isSucesso
    ? tokens.colors.status.greenBg
    : '#F0F9FF';

  const titleColor = isCritico
    ? tokens.colors.status.redText
    : isSucesso
    ? tokens.colors.status.greenText
    : '#0369A1';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 12) + tokens.spacing.xs,
          transform: [{ translateY }],
          opacity,
          backgroundColor: bgColor,
          borderColor,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <ThemedText style={styles.iconText}>{activeToast.icone || '🔔'}</ThemedText>
        </View>

        <View style={styles.textContent}>
          <ThemedText variant="subtitle" style={[styles.title, { color: titleColor }]}>
            {activeToast.titulo}
          </ThemedText>
          <ThemedText variant="caption" color={tokens.colors.textPrimary} style={styles.mensagem}>
            {activeToast.mensagem}
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={dismissToast}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Fechar notificação"
        >
          <ThemedText style={styles.closeIcon}>✕</ThemedText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    zIndex: 9999,
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    padding: tokens.spacing.md,
    ...shadows.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
  },
  iconContainer: {
    paddingTop: 2,
  },
  iconText: {
    fontSize: 20,
  },
  textContent: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  mensagem: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    padding: tokens.spacing.xs,
  },
  closeIcon: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    fontWeight: 'bold',
  },
});
