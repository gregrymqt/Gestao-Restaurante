import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Store, ArrowLeftRight } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { RestauranteTenant } from '@/features/auth';

interface TenantBranchCardProps {
  tenant: RestauranteTenant | null;
  onTrocarFilial: () => void;
}

export function TenantBranchCard({
  tenant,
  onTrocarFilial,
}: TenantBranchCardProps) {
  const nome = tenant?.nome || 'Restaurante Teste E2E';
  const filial = tenant?.filialNumero || 'FILIAL #01';
  const cnpj = tenant?.cnpj || '12.345.678/0001-90';

  return (
    <View style={styles.card}>
      <View style={styles.contentLeft}>
        {/* Ícone de Unidade Operacional */}
        <View style={styles.iconBox}>
          <Store size={20} color={tokens.colors.primary} />
        </View>

        {/* Detalhes da Filial e CNPJ */}
        <View style={styles.textContainer}>
          <ThemedText variant="body" style={styles.tenantName} numberOfLines={1}>
            {nome}
          </ThemedText>
          <View style={styles.subRow}>
            <View style={styles.filialTag}>
              <ThemedText style={styles.filialText}>{filial}</ThemedText>
            </View>
            <ThemedText style={styles.cnpjLabel}>
              • CNPJ: {cnpj}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Botão de Alternância de Filial */}
      <TouchableOpacity
        style={styles.switchButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Trocar unidade ou filial"
        onPress={onTrocarFilial}
      >
        <ThemedText style={styles.switchButtonText}>Trocar</ThemedText>
        <ArrowLeftRight size={14} color={tokens.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
    minWidth: 0,
    marginRight: tokens.spacing.xs,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  tenantName: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  filialTag: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radii.sm,
    flexShrink: 0,
  },
  filialText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  cnpjLabel: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    flexShrink: 0,
  },
  switchButtonText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
});
