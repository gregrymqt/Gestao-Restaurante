import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { useDialogStore, DialogType, DialogButton } from './dialogStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DIALOG_CONFIG: Record<
  DialogType,
  {
    icon: string;
    iconColor: string;
    iconBg: string;
    buttonBg: string;
    badgeBorder: string;
  }
> = {
  success: {
    icon: '✓',
    iconColor: tokens.colors.status.greenText,
    iconBg: tokens.colors.status.greenBg,
    buttonBg: tokens.colors.status.greenText,
    badgeBorder: '#A3E5B4',
  },
  error: {
    icon: '✕',
    iconColor: tokens.colors.status.redText,
    iconBg: tokens.colors.status.redBg,
    buttonBg: tokens.colors.status.redText,
    badgeBorder: '#F2B8B5',
  },
  warning: {
    icon: '!',
    iconColor: tokens.colors.status.orangeText,
    iconBg: tokens.colors.status.orangeBg,
    buttonBg: tokens.colors.status.orangeText,
    badgeBorder: '#FFD8A8',
  },
  info: {
    icon: 'i',
    iconColor: '#1A73E8',
    iconBg: '#E8F0FE',
    buttonBg: '#1A73E8',
    badgeBorder: '#B3D1FF',
  },
};

export function AppDialogHost() {
  const isOpen = useDialogStore((state) => state.isOpen);
  const options = useDialogStore((state) => state.options);
  const close = useDialogStore((state) => state.close);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [isOpen, fadeAnim, scaleAnim, useNativeDriver]);

  if (!isOpen || !options) {
    return null;
  }

  const type: DialogType = options.type || 'info';
  const config = DIALOG_CONFIG[type];

  const handleDismiss = () => {
    if (options.allowOutsideClick) {
      handleButtonPress(options.onCancel);
    }
  };

  const handleButtonPress = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver,
      }),
    ]).start(() => {
      close();
      if (callback) {
        callback();
      }
    });
  };

  // Determina lista de botões a renderizar
  const renderButtons = () => {
    if (options.buttons && options.buttons.length > 0) {
      return (
        <View style={[styles.buttonContainer, options.buttons.length > 2 && styles.buttonsStacked]}>
          {options.buttons.map((btn, index) => {
            const isCancel = btn.style === 'cancel';
            const isDestructive = btn.style === 'destructive';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  isCancel ? styles.buttonCancel : styles.buttonPrimary,
                  !isCancel && { backgroundColor: isDestructive ? tokens.colors.status.redText : config.buttonBg },
                ]}
                onPress={() => handleButtonPress(btn.onPress)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={btn.text}
              >
                <ThemedText
                  variant="body"
                  weight="bold"
                  style={isCancel ? styles.buttonCancelText : styles.buttonPrimaryText}
                >
                  {btn.text}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // Padrão: Confirmar e Opcional Cancelar
    const hasCancel = Boolean(options.cancelText);
    const confirmLabel = options.confirmText || 'OK';

    return (
      <View style={styles.buttonContainer}>
        {hasCancel && (
          <TouchableOpacity
            style={[styles.button, styles.buttonCancel]}
            onPress={() => handleButtonPress(options.onCancel)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <ThemedText variant="body" weight="bold" style={styles.buttonCancelText}>
              {options.cancelText}
            </ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, { backgroundColor: config.buttonBg }]}
          onPress={() => handleButtonPress(options.onConfirm)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <ThemedText variant="body" weight="bold" style={styles.buttonPrimaryText}>
            {confirmLabel}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Fechar diálogo"
        />
        <Animated.View
          style={[
            styles.dialogCard,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
          accessibilityRole="alert"
          accessibilityViewIsModal
        >
          {/* Ícone SweetAlert com anel externo pulsante */}
          <View style={[styles.iconCircle, { backgroundColor: config.iconBg, borderColor: config.badgeBorder }]}>
            <ThemedText style={[styles.iconSymbol, { color: config.iconColor }]}>
              {config.icon}
            </ThemedText>
          </View>

          {/* Título do Diálogo */}
          <ThemedText variant="title" weight="bold" style={styles.title}>
            {options.title}
          </ThemedText>

          {/* Mensagem Explicativa */}
          {Boolean(options.message) && (
            <ThemedText variant="body" style={styles.message}>
              {options.message}
            </ThemedText>
          )}

          {/* Ações / Botões */}
          {renderButtons()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  dialogCard: {
    width: Math.min(SCREEN_WIDTH - 48, 380),
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    ...shadows.dialog,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSymbol: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    color: tokens.colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    color: tokens.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  buttonsStacked: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonPrimary: {
    backgroundColor: tokens.colors.primary,
  },
  buttonPrimaryText: {
    color: tokens.colors.white,
    fontSize: 14,
  },
  buttonCancel: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  buttonCancelText: {
    color: tokens.colors.textSecondary,
    fontSize: 14,
  },
});
