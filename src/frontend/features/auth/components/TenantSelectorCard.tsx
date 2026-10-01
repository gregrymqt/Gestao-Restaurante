import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { RestauranteTenant } from '../types';

interface TenantSelectorCardProps {
  tenant: RestauranteTenant | null;
  onPressAlterar: () => void;
}

export function TenantSelectorCard({
  tenant,
  onPressAlterar,
}: TenantSelectorCardProps) {
  return (
    <View style={styles.container}>
      {/* Label Row */}
      <View style={styles.labelRow}>
        <View style={styles.tagTitleGroup}>
          <Ionicons name="business-outline" size={14} color={tokens.colors.primaryDark} />
          <ThemedText variant="caption" style={styles.sectionLabel}>
            UNIDADE / FILIAL ATIVA
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressAlterar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            Trocar Loja
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Main Tenant Card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressAlterar}
        style={styles.card}
      >
        <View style={styles.storeIconBox}>
          <Ionicons name="storefront-outline" size={20} color={tokens.colors.primary} />
        </View>

        <View style={styles.storeInfo}>
          <View style={styles.nameRow}>
            <ThemedText variant="body" weight="bold" style={styles.storeName}>
              {tenant?.nome || 'Restaurante Matriz'}
            </ThemedText>
            <View style={styles.activeDot} />
          </View>

          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.cnpjLabel}>
            CNPJ: {tenant?.cnpj || '12.345.678/0001-90'} • {tenant?.filialNumero || 'Filial Principal'}
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={18} color={tokens.colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  tagTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '800',
    color: tokens.colors.primaryDark,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...shadows.sm,
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  storeInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    color: tokens.colors.textPrimary,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.greenText,
  },
  cnpjLabel: {
    marginTop: 2,
    fontSize: 11,
  },
});
