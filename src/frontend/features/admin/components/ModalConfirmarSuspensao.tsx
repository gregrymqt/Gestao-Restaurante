import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { TenantAdminItem } from '../types';

interface ModalConfirmarSuspensaoProps {
  visible: boolean;
  tenant: TenantAdminItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmar: (restauranteId: string) => void;
}

export function ModalConfirmarSuspensao({
  visible,
  tenant,
  isSubmitting,
  onClose,
  onConfirmar,
}: ModalConfirmarSuspensaoProps) {
  if (!tenant) return null;

  const handleConfirmar = () => {
    if (!isSubmitting) {
      onConfirmar(tenant.restauranteId);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header de Atenção */}
          <View style={styles.tagAlerta}>
            <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>
              ⚠️ AÇÃO CRÍTICA & DESTRUTIVA
            </ThemedText>
          </View>

          <ThemedText variant="subtitle" weight="bold" style={styles.titulo}>
            Suspender Inquilino?
          </ThemedText>

          {/* Dados do Restaurante */}
          <View style={styles.lojaBox}>
            <ThemedText variant="caption" weight="bold" numberOfLines={1}>
              🏪 {tenant.nomeRestaurante}
            </ThemedText>
            <ThemedText variant="caption" style={styles.cnpj}>
              CNPJ: {tenant.cnpj} • Gestor: {tenant.gestorNome}
            </ThemedText>
          </View>

          {/* Mensagem de Impacto Operacional */}
          <View style={styles.alertaImpacto}>
            <ThemedText variant="caption" color={tokens.colors.status.redText} style={styles.textoImpacto}>
              Ao suspender este inquilino, o status mudará para <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>EXPIRADA</ThemedText>. Os operadores perderão imediatamente o acesso ao PDV e à emissão de pedidos na frente de caixa.
            </ThemedText>
          </View>

          {/* Botões de Ação */}
          <View style={styles.botoesRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar suspensão"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [styles.botaoCancelar, pressed && styles.pressed]}
            >
              <ThemedText variant="caption" weight="bold" color={tokens.colors.textPrimary}>
                Voltar com Segurança
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar suspensão da loja"
              disabled={isSubmitting}
              onPress={handleConfirmar}
              style={({ pressed }) => [
                styles.botaoSuspender,
                isSubmitting && styles.botaoDesabilitado,
                pressed && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={tokens.colors.white} />
              ) : (
                <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
                  ✕ Confirmar Suspensão
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: tokens.spacing.lg,
  },
  tagAlerta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.sm,
  },
  titulo: {
    fontSize: 18,
    color: tokens.colors.status.redText,
    marginBottom: tokens.spacing.sm,
  },
  lojaBox: {
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  cnpj: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  alertaImpacto: {
    backgroundColor: '#FEF2F2',
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.lg,
  },
  textoImpacto: {
    fontSize: 12,
    lineHeight: 18,
  },
  botoesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
  },
  botaoCancelar: {
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  botaoSuspender: {
    backgroundColor: tokens.colors.status.redText,
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
