import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface HeroActionsGridProps {
  pedidosNaCozinha: number;
  isOffline?: boolean;
  onAbrirPdv: () => void;
  onAbrirKds: () => void;
}

export function HeroActionsGrid({
  pedidosNaCozinha,
  isOffline = false,
  onAbrirPdv,
  onAbrirKds,
}: HeroActionsGridProps) {
  return (
    <View style={styles.container}>
      {/* Botão Principal: Novo Pedido / PDV */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isOffline
            ? 'Novo pedido indisponível no modo offline'
            : 'Abrir PDV para novo pedido'
        }
        disabled={isOffline}
        onPress={onAbrirPdv}
        style={({ pressed }) => [
          styles.btn,
          isOffline ? styles.btnDisabled : styles.btnPrimary,
          !isOffline && pressed && styles.btnPressed,
        ]}
      >
        <View style={styles.btnIconContainer}>
          <Ionicons
            name={isOffline ? 'lock-closed' : 'cart'}
            size={24}
            color={isOffline ? '#6B7280' : tokens.colors.white}
          />
        </View>
        <ThemedText
          variant="body"
          weight="bold"
          color={isOffline ? '#6B7280' : tokens.colors.white}
        >
          Novo Pedido
        </ThemedText>
        <ThemedText
          variant="caption"
          style={styles.btnSub}
          color={isOffline ? '#9CA3AF' : 'rgba(255,255,255,0.8)'}
        >
          {isOffline ? 'Bloqueado no modo offline' : 'Abrir PDV'}
        </ThemedText>
      </Pressable>

      {/* Botão Secundário: Painel da Cozinha (KDS) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Painel da cozinha, ${pedidosNaCozinha} pedidos ativos`}
        onPress={onAbrirKds}
        style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnSecPressed]}
      >
        {pedidosNaCozinha > 0 && (
          <View style={styles.badge} accessibilityLabel={`${pedidosNaCozinha} ativos`}>
            <ThemedText variant="caption" weight="bold" color={tokens.colors.white} style={styles.badgeText}>
              {pedidosNaCozinha}
            </ThemedText>
          </View>
        )}
        <View style={styles.btnIconContainer}>
          <MaterialCommunityIcons name="chef-hat" size={24} color={tokens.colors.primary} />
        </View>
        <ThemedText variant="body" weight="bold" color={tokens.colors.textPrimary}>
          Cozinha (KDS)
        </ThemedText>
        <ThemedText variant="caption" style={styles.btnSubSec}>
          {pedidosNaCozinha > 0
            ? `${pedidosNaCozinha} pedidos ativos`
            : 'Nenhum pedido'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
  },
  btn: {
    flex: 1,
    minHeight: 80,          // zona de toque ≥ 64px útil
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
  },
  btnPrimary: {
    backgroundColor: tokens.colors.primary,
  },
  btnDisabled: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnPressed: {
    backgroundColor: tokens.colors.primaryDark,
  },
  btnSecondary: {
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  btnSecPressed: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primary,
  },
  btnIconContainer: {
    marginBottom: tokens.spacing.xs,
  },
  btnSub: {
    marginTop: 2,
  },
  btnSubSec: {
    marginTop: 2,
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
  },
  badge: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
