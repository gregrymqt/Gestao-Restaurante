import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { TipoMovimentacaoCaixa } from '../types';

interface ModalMovimentacaoCaixaProps {
  visible: boolean;
  tipo: TipoMovimentacaoCaixa;
  saldoDisponivel: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (dados: { valor: number; motivo: string }) => Promise<void>;
}

export function ModalMovimentacaoCaixa({
  visible,
  tipo,
  saldoDisponivel,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ModalMovimentacaoCaixaProps) {
  const [valorTexto, setValorTexto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const isSuprimento = tipo === 'SUPRIMENTO';

  useEffect(() => {
    if (visible) {
      setValorTexto('');
      setMotivo('');
      setErro(null);
    }
  }, [visible, tipo]);

  const valorNumerico = parseFloat(valorTexto.replace(',', '.')) || 0;
  const saldoInsuficiente = !isSuprimento && valorNumerico > saldoDisponivel;

  const handleAdicionarValor = (adicional: number) => {
    const novoValor = valorNumerico + adicional;
    setValorTexto(novoValor.toFixed(2).replace('.', ','));
    if (erro) setErro(null);
  };

  const handlePreencherTudo = () => {
    setValorTexto(saldoDisponivel.toFixed(2).replace('.', ','));
    if (erro) setErro(null);
  };

  const handleConfirmar = async () => {
    if (valorNumerico <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }
    if (saldoInsuficiente) {
      setErro(`Valor acima do saldo disponível em dinheiro (${formatarMoeda(saldoDisponivel)}).`);
      return;
    }
    if (!motivo.trim()) {
      setErro('Informe o motivo ou justificativa da movimentação.');
      return;
    }
    setErro(null);
    await onSubmit({ valor: valorNumerico, motivo: motivo.trim() });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.dragIndicator} />

            {/* Cabeçalho Compacto com Ícone SVG Branco e Círculo Translúcido */}
            <View style={[styles.header, isSuprimento ? styles.headerSuprimento : styles.headerSangria]}>
              <View style={styles.headerIconCircle}>
                <Ionicons
                  name={isSuprimento ? 'add' : 'remove'}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.headerTexts}>
                <ThemedText variant="subtitle" weight="bold" color="#FFFFFF">
                  {isSuprimento ? 'Entrada de Suprimento (Troco)' : 'Sangria de Caixa (Retirada)'}
                </ThemedText>
                <ThemedText variant="caption" style={styles.headerSubtext}>
                  {isSuprimento
                    ? 'Aporte de dinheiro físico para troco inicial na gaveta'
                    : 'Retirada de segurança do dinheiro em espécie para o cofre'}
                </ThemedText>
              </View>
            </View>

            {/* Corpo Rolável do Modal */}
            <ScrollView
              style={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Saldo Atual em Espécie */}
              <View style={styles.saldoRow}>
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  Saldo em Espécie na Gaveta:
                </ThemedText>
                <ThemedText variant="body" weight="bold" color={tokens.colors.textPrimary}>
                  {formatarMoeda(saldoDisponivel)}
                </ThemedText>
              </View>

              {/* Campo Valor */}
              <View style={styles.inputGroup}>
                <ThemedText variant="caption" weight="bold" style={styles.label}>
                  VALOR (R$):
                </ThemedText>
                <TextInput
                  style={[styles.inputValor, saldoInsuficiente && styles.inputErrorBorder]}
                  placeholder="0,00"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="decimal-pad"
                  value={valorTexto}
                  onChangeText={(txt) => {
                    setValorTexto(txt);
                    if (erro) setErro(null);
                  }}
                  autoFocus
                />
              </View>

              {/* Chips de Preenchimento Rápido */}
              <View style={styles.chipsContainer}>
                <ThemedText variant="caption" style={styles.chipsLabel}>
                  Atalhos de valor:
                </ThemedText>
                <View style={styles.chipsRow}>
                  <Pressable
                    style={styles.chip}
                    onPress={() => handleAdicionarValor(50)}
                    hitSlop={6}
                  >
                    <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                      + R$ 50
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.chip}
                    onPress={() => handleAdicionarValor(100)}
                    hitSlop={6}
                  >
                    <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                      + R$ 100
                    </ThemedText>
                  </Pressable>
                  {isSuprimento ? (
                    <Pressable
                      style={styles.chip}
                      onPress={() => handleAdicionarValor(200)}
                      hitSlop={6}
                    >
                      <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                        + R$ 200
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.chip, styles.chipTudo]}
                      onPress={handlePreencherTudo}
                      hitSlop={6}
                    >
                      <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>
                        Tudo ({formatarMoeda(saldoDisponivel)})
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Campo Motivo / Justificativa */}
              <View style={styles.inputGroup}>
                <ThemedText variant="caption" weight="bold" style={styles.label}>
                  MOTIVO / JUSTIFICATIVA:
                </ThemedText>
                <TextInput
                  style={styles.inputMotivo}
                  placeholder={
                    isSuprimento
                      ? 'Ex: Fundo de troco abertura turno'
                      : 'Ex: Sangria periódica para o cofre central'
                  }
                  placeholderTextColor={tokens.colors.textMuted}
                  value={motivo}
                  onChangeText={(txt) => {
                    setMotivo(txt);
                    if (erro) setErro(null);
                  }}
                />
              </View>

              {/* Mensagem de Erro / Validação */}
              {erro ? (
                <View style={styles.errorBox}>
                  <ThemedText variant="caption" color={tokens.colors.status.redText}>
                    ⚠️ {erro}
                  </ThemedText>
                </View>
              ) : null}
            </ScrollView>

            {/* Rodapé Fixo de Ações - Sempre Visível */}
            <View style={styles.footerFixed}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cancelarButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <ThemedText variant="body" style={styles.cancelarText}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.confirmarButton,
                  isSuprimento ? styles.confirmarSuprimento : styles.confirmarSangria,
                  (isSubmitting || valorNumerico <= 0 || saldoInsuficiente) && styles.buttonDisabled,
                ]}
                onPress={handleConfirmar}
                disabled={isSubmitting || valorNumerico <= 0 || saldoInsuficiente}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText variant="body" weight="bold" color="#FFFFFF">
                    {isSuprimento ? 'Confirmar Entrada' : 'Confirmar Retirada'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '85%',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
    borderRadius: tokens.radii.md,
    gap: tokens.spacing.sm,
  },
  headerSuprimento: {
    backgroundColor: '#1E6B3A',
  },
  headerSangria: {
    backgroundColor: '#A82A2A',
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  headerSubtext: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontSize: tokens.typography.fontXs,
  },
  formScroll: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  inputGroup: {
    marginBottom: tokens.spacing.sm,
  },
  label: {
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.xs,
    letterSpacing: 0.5,
  },
  inputValor: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  chipsContainer: {
    marginBottom: tokens.spacing.md,
  },
  chipsLabel: {
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.xs,
    fontSize: tokens.typography.fontXs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  chipTudo: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: tokens.colors.status.redText,
  },
  inputMotivo: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
  },
  inputErrorBorder: {
    borderColor: tokens.colors.status.redText,
  },
  errorBox: {
    backgroundColor: '#FFECEC',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.sm,
  },
  footerFixed: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? tokens.spacing.xl : tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  cancelarButton: {
    flex: 1,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  cancelarText: {
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
  confirmarButton: {
    flex: 2,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  confirmarSuprimento: {
    backgroundColor: '#1E6B3A',
  },
  confirmarSangria: {
    backgroundColor: '#A82A2A',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
