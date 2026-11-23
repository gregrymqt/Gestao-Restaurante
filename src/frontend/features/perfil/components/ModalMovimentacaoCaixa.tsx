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
import { AlertTriangle } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { TipoMovimentacaoCaixa } from '../types';
import { styles } from './ModalMovimentacaoCaixa.styles';
import { AtalhosValorChips } from './AtalhosValorChips';

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
  const [isFocused, setIsFocused] = useState(false);

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

  const saldoProjetado = isSuprimento
    ? saldoDisponivel + valorNumerico
    : saldoDisponivel - valorNumerico;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
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

              {/* Campo Valor com Botão Limpar */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <ThemedText variant="caption" weight="bold" style={styles.label}>
                    VALOR (R$):
                  </ThemedText>
                  {valorNumerico > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setValorTexto('');
                        if (erro) setErro(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Limpar valor digitado"
                    >
                      <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                        Limpar
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[
                    styles.inputValor,
                    isFocused && (isSuprimento ? styles.inputValorFocadoSuprimento : styles.inputValorFocadoSangria),
                    saldoInsuficiente && styles.inputErrorBorder,
                  ]}
                  placeholder="0,00"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="decimal-pad"
                  value={valorTexto}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChangeText={(txt) => {
                    setValorTexto(txt);
                    if (erro) setErro(null);
                  }}
                  autoFocus
                />
              </View>

              {/* Chips de Preenchimento Rápido */}
              <AtalhosValorChips
                isSuprimento={isSuprimento}
                saldoDisponivel={saldoDisponivel}
                onAdicionarValor={handleAdicionarValor}
                onPreencherTudo={handlePreencherTudo}
              />

              {/* Projeção do Saldo em Tempo Real (Abaixo dos Atalhos) */}
              {valorNumerico > 0 && (
                <View style={styles.projecaoContainer}>
                  <ThemedText variant="caption" style={styles.projecaoLabel}>
                    Saldo projetado na gaveta:
                  </ThemedText>
                  <ThemedText
                    variant="caption"
                    weight="bold"
                    style={[
                      styles.projecaoValor,
                      {
                        color: isSuprimento
                          ? '#059669'
                          : saldoInsuficiente
                          ? tokens.colors.status.redText
                          : '#D97706',
                      },
                    ]}
                  >
                    {formatarMoeda(saldoDisponivel)} → {formatarMoeda(saldoProjetado)}
                  </ThemedText>
                </View>
              )}

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
                  <AlertTriangle size={14} color={tokens.colors.status.redText} />
                  <ThemedText variant="caption" color={tokens.colors.status.redText} style={styles.errorText}>
                    {erro}
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
                accessibilityRole="button"
                accessibilityLabel="Cancelar movimentação de caixa"
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
                accessibilityRole="button"
                accessibilityLabel={isSuprimento ? 'Confirmar entrada de suprimento' : 'Confirmar retirada de sangria'}
                accessibilityState={{ disabled: isSubmitting || valorNumerico <= 0 || saldoInsuficiente }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText
                    variant="body"
                    weight="bold"
                    color={(isSubmitting || valorNumerico <= 0 || saldoInsuficiente) ? '#6B7280' : '#FFFFFF'}
                  >
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
