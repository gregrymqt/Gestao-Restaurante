import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

interface BotoesMovimentacaoTurnoProps {
  onSuprimento: () => void;
  onSangria: () => void;
  disabled?: boolean;
}

export function BotoesMovimentacaoTurno({
  onSuprimento,
  onSangria,
  disabled = false,
}: BotoesMovimentacaoTurnoProps) {
  return (
    <View style={styles.row}>
      {/* + Suprimento */}
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styles.btnSuprimento,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.btnPressed,
        ]}
        disabled={disabled}
        onPress={onSuprimento}
        accessibilityRole="button"
        accessibilityLabel="Registrar suprimento de troco"
        hitSlop={8}
      >
        <Ionicons name="add-circle-outline" size={18} color={tokens.colors.status.greenText} />
        <ThemedText
          variant="caption"
          weight="semibold"
          color={tokens.colors.status.greenText}
          style={styles.btnTexto}
        >
          Suprimento
        </ThemedText>
      </Pressable>

      {/* - Sangria */}
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styles.btnSangria,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.btnPressed,
        ]}
        disabled={disabled}
        onPress={onSangria}
        accessibilityRole="button"
        accessibilityLabel="Registrar sangria de caixa"
        hitSlop={8}
      >
        <Ionicons name="remove-circle-outline" size={18} color={tokens.colors.status.redText} />
        <ThemedText
          variant="caption"
          weight="semibold"
          color={tokens.colors.status.redText}
          style={styles.btnTexto}
        >
          Sangria
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    borderWidth: 1,
  },
  btnSuprimento: {
    backgroundColor: tokens.colors.status.greenBg,
    borderColor: tokens.colors.border,
  },
  btnSangria: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: tokens.colors.border,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnTexto: {
    fontSize: tokens.typography.fontSm,
  },
});
