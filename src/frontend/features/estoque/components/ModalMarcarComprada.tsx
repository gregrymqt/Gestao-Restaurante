import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle2, X, Building2, FileText } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';

interface ModalMarcarCompradaProps {
  visible: boolean;
  protocolo: string;
  totalItens: number;
  valorTotalEstimado: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirmar: (dados: { fornecedor?: string; observacao?: string }) => Promise<void>;
}

export function ModalMarcarComprada({
  visible,
  protocolo,
  totalItens,
  valorTotalEstimado,
  isSubmitting = false,
  onClose,
  onConfirmar,
}: ModalMarcarCompradaProps) {
  const [fornecedor, setFornecedor] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleSalvar = async () => {
    await onConfirmar({
      fornecedor: fornecedor.trim() || undefined,
      observacao: observacao.trim() || undefined,
    });
    setFornecedor('');
    setObservacao('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <CheckCircle2 size={22} color={tokens.colors.primary} />
              <ThemedText variant="subtitle" weight="bold">
                Marcar como Comprada
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <X size={20} color={tokens.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoBox}>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Ordem: <ThemedText variant="caption" weight="bold">{protocolo}</ThemedText>
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              {totalItens} insumos · Total Estimado:{' '}
              <ThemedText variant="caption" weight="bold">
                R$ {valorTotalEstimado.toFixed(2)}
              </ThemedText>
            </ThemedText>
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Building2 size={16} color={tokens.colors.textSecondary} />
              <ThemedText variant="caption" weight="medium" color={tokens.colors.textSecondary}>
                Fornecedor Escolhido (Opcional)
              </ThemedText>
            </View>
            <TextInput
              style={styles.input}
              value={fornecedor}
              onChangeText={setFornecedor}
              placeholder="Ex: Distribuidora Central de Alimentos"
              placeholderTextColor={tokens.colors.textMuted}
              editable={!isSubmitting}
              maxLength={150}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <FileText size={16} color={tokens.colors.textSecondary} />
              <ThemedText variant="caption" weight="medium" color={tokens.colors.textSecondary}>
                Observações / Previsão de Entrega (Opcional)
              </ThemedText>
            </View>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Ex: Pedido feito por WhatsApp. Previsão de entrega amanhã às 08h."
              placeholderTextColor={tokens.colors.textMuted}
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
              maxLength={500}
            />
          </View>

          {/* Botões */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancelar pedido"
            >
              <ThemedText variant="body" color={tokens.colors.textSecondary}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSalvar}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Confirmar pedido"
              accessibilityState={{ disabled: isSubmitting }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={tokens.colors.white} />
              ) : (
                <ThemedText variant="body" weight="bold" color={tokens.colors.white}>
                  Confirmar Pedido
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.lg,
    width: '100%',
    maxWidth: 480,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    ...createShadow({
      offsetY: 6,
      radius: 12,
      opacity: 0.15,
      elevation: 6,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 6,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.sm,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.primary,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    height: 44,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: tokens.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: tokens.radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: tokens.radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
