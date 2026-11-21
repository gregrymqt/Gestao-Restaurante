import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Building2 } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { RestauranteTenant } from '../types';

interface TenantItemCardProps {
  tenant: RestauranteTenant;
  isSelected: boolean;
  onSelect: () => void;
}

export function TenantItemCard({
  tenant,
  isSelected,
  onSelect,
}: TenantItemCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Selecionar unidade ${tenant.nome}`}
      onPress={onSelect}
      style={[styles.tenantItem, isSelected && styles.tenantItemActive]}
    >
      <View style={styles.iconBox}>
        <Building2 size={20} color={tokens.colors.primary} />
      </View>

      <View style={styles.tenantDetails}>
        <ThemedText variant="body" weight="bold" style={styles.tenantNome}>
          {tenant.nome}
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          CNPJ: {tenant.cnpj} • {tenant.filialNumero}
        </ThemedText>
      </View>

      {isSelected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark-circle" size={18} color={tokens.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  tenantItemActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primaryLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  tenantDetails: {
    flex: 1,
  },
  tenantNome: {
    color: tokens.colors.textPrimary,
    marginBottom: 2,
  },
  checkBadge: {
    marginLeft: tokens.spacing.sm,
  },
});
