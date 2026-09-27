import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
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
          <ThemedText style={styles.buildingIcon}>🏢</ThemedText>
          <ThemedText variant="caption" style={styles.sectionLabel}>
            UNIDADE OPERACIONAL
          </ThemedText>
        </View>

        <View style={styles.multiTenantBadge}>
          <ThemedText variant="caption" style={styles.multiTenantBadgeText}>
            Multi-Tenant
          </ThemedText>
        </View>
      </View>

      {/* Main Tenant Card */}
      <View style={styles.card}>
        <View style={styles.storeIconBox}>
          <ThemedText style={styles.storeIcon}>🍔</ThemedText>
        </View>

        <View style={styles.storeInfo}>
          <View style={styles.nameRow}>
            <ThemedText variant="body" style={styles.storeName}>
              {tenant?.nome || 'GastroBurger - Matriz'}
            </ThemedText>
            <View style={styles.activeDot} />
          </View>

          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.cnpjText}>
            CNPJ: {tenant?.cnpj || '12.345.678/0001-90'} • {tenant?.filialNumero || 'Filial #01'}
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressAlterar}
          style={styles.alterarButton}
        >
          <ThemedText variant="caption" style={styles.alterarText}>
            Alterar ⌄
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buildingIcon: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '800',
    color: tokens.colors.primaryDark,
    letterSpacing: 0.6,
  },
  multiTenantBadge: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  multiTenantBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  storeIcon: {
    fontSize: 20,
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
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.greenText,
  },
  cnpjText: {
    marginTop: 2,
    fontSize: 11,
  },
  alterarButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  alterarText: {
    fontWeight: '700',
    color: tokens.colors.primaryDark,
    fontSize: 11,
  },
});
