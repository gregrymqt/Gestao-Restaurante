import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
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
  const [busca, setBusca] = useState('');

  const filiaisFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return tenants;
    return tenants.filter(
      (t) =>
        t.nome.toLowerCase().includes(termo) ||
        t.cnpj.replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
        t.cnpj.toLowerCase().includes(termo) ||
        (t.filialNumero && t.filialNumero.toLowerCase().includes(termo))
    );
  }, [busca, tenants]);

  const handleSelect = (t: RestauranteTenant) => {
    onSelectTenant(t);
    setBusca('');
    onClose();
  };

  const handleClose = () => {
    setBusca('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar seleção de filial"
          style={styles.backdrop}
          onPress={handleClose}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <ThemedText variant="subtitle" weight="bold" style={styles.title}>
              Selecionar Unidade / Filial
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Escolha a loja que deseja gerenciar neste acesso
            </ThemedText>
          </View>

          {/* Barra de Pesquisa */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={tokens.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, filial ou CNPJ..."
              placeholderTextColor={tokens.colors.textMuted}
              value={busca}
              onChangeText={setBusca}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {busca.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusca('')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={18} color={tokens.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista Virtualizada FlashList */}
          <View style={styles.listContainer}>
            <FlashList
              data={filiaisFiltradas}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText variant="caption" color={tokens.colors.textMuted}>
                    Nenhuma unidade encontrada para "{busca}".
                  </ThemedText>
                </View>
              }
              renderItem={({ item: t }) => {
                const isSelected = t.id === tenantAtivoId;

                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelect(t)}
                    style={[styles.tenantItem, isSelected && styles.tenantItemActive]}
                  >
                    <View style={styles.iconBox}>
                      <ThemedText style={styles.icon}>🏢</ThemedText>
                    </View>

                    <View style={styles.tenantDetails}>
                      <ThemedText variant="body" weight="bold" style={styles.tenantNome}>
                        {t.nome}
                      </ThemedText>
                      <ThemedText variant="caption" color={tokens.colors.textMuted}>
                        CNPJ: {t.cnpj} • {t.filialNumero}
                      </ThemedText>
                    </View>

                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={18} color={tokens.colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleClose}
              style={styles.fecharButton}
            >
              <ThemedText variant="body" weight="bold" style={styles.fecharButtonText}>
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
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '80%',
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
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  title: {
    fontSize: tokens.typography.fontLg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
    height: 44,
    gap: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
  },
  listContainer: {
    height: 280,
    paddingHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
  },
  emptyContainer: {
    paddingVertical: tokens.spacing.xl,
    alignItems: 'center',
  },
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
  icon: {
    fontSize: 20,
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
  footer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
  },
  fecharButton: {
    width: '100%',
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  fecharButtonText: {
    color: tokens.colors.textSecondary,
  },
});
