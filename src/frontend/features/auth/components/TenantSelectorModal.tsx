import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { RestauranteTenant } from '../types';

interface TenantSelectorModalProps {
  visible: boolean;
  tenants: RestauranteTenant[];
  tenantAtivoId: string;
  onSelectTenant: (tenant: RestauranteTenant) => void;
  onClose: () => void;
}

export function TenantSelectorModal({
  visible,
  tenants,
  tenantAtivoId,
  onSelectTenant,
  onClose,
}: TenantSelectorModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <ThemedText variant="title" style={styles.title}>
              Selecionar Unidade Operacional
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Filiais autorizadas para autenticação neste terminal
            </ThemedText>
          </View>

          <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
            {tenants.map((t) => {
              const isSelected = t.id === tenantAtivoId;

              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectTenant(t);
                    onClose();
                  }}
                  style={[styles.tenantItem, isSelected && styles.tenantItemActive]}
                >
                  <View style={styles.iconBox}>
                    <ThemedText style={styles.icon}>🏢</ThemedText>
                  </View>

                  <View style={styles.tenantDetails}>
                    <ThemedText variant="body" style={styles.tenantNome}>
                      {t.nome}
                    </ThemedText>
                    <ThemedText variant="caption" color={tokens.colors.textMuted}>
                      CNPJ: {t.cnpj} • {t.filialNumero}
                    </ThemedText>
                  </View>

                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <ThemedText variant="caption" style={styles.checkBadgeText}>
                        ✓ ATIVO
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.fecharButton}
            >
              <ThemedText variant="body" style={styles.fecharButtonText}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '75%',
    paddingBottom: tokens.spacing.lg,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  header: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  listScroll: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  tenantItemActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#FFF9F8',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  tenantDetails: {
    flex: 1,
  },
  tenantNome: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  checkBadge: {
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  checkBadgeText: {
    color: tokens.colors.status.greenText,
    fontWeight: '800',
    fontSize: 10,
  },
  footer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  fecharButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fecharButtonText: {
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
});
