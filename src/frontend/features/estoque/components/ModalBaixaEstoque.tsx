import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PackageX, CalendarX, ClipboardCheck, X, AlertTriangle } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { formatarQuantidade } from '@/shared/utils/formatters';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { InsumoEstoque, BaixaEstoqueInput, MotivoBaixaEstoque } from '../types';
import { ModalAuditCallout } from './ModalAuditCallout';
import { modalBottomSheetStyles as sheetStyles } from './modalBottomSheetStyles';

interface ModalBaixaEstoqueProps {
  visible: boolean;
  insumo: InsumoEstoque | null;
  onClose: () => void;
  onConfirmar: (dados: BaixaEstoqueInput) => Promise<void>;
  isEnviando?: boolean;
}

const MOTIVOS = [
  { id: 'Avaria' as const, label: 'Avaria / Quebra', Icon: PackageX },
  { id: 'Validade' as const, label: 'Validade Vencida', Icon: CalendarX },
  { id: 'Inventario' as const, label: 'Ajuste Inventário', Icon: ClipboardCheck },
];

export function ModalBaixaEstoque({
  visible,
  insumo,
  onClose,
  onConfirmar,
  isEnviando = false,
}: ModalBaixaEstoqueProps) {
  const insets = useSafeAreaInsets();
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);

  const [motivo, setMotivo] = useState<MotivoBaixaEstoque>('Avaria');
  const [quantidadeTexto, setQuantidadeTexto] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (visible) {
      setMotivo('Avaria');
      setQuantidadeTexto('');
      setObservacao('');
    }
  }, [visible]);

  if (!insumo) return null;

  const qtd = parseFloat(quantidadeTexto.replace(',', '.'));
  const isQtdValida = !isNaN(qtd) && qtd > 0;
  const isExcedente = isQtdValida && qtd > insumo.saldoAtual;
  const saldoProjetado = isQtdValida ? Math.max(0, insumo.saldoAtual - qtd) : null;
  const isFormValido = isQtdValida && !isExcedente && isApiOnline && !isEnviando;

  const handleConfirmar = async () => {
    if (!isQtdValida) {
      AppDialog.warning('Quantidade Inválida', 'Informe uma quantidade válida e maior que zero.');
      return;
    }
    if (isExcedente) {
      AppDialog.warning('Saldo Insuficiente', 'A baixa não pode superar o saldo atual.');
      return;
    }
    await onConfirmar({
      insumoId: insumo.id,
      quantidade: qtd,
      motivo,
      observacao: observacao.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <View style={sheetStyles.sheetContainer}>
          <View style={sheetStyles.dragIndicator} />

          <View style={sheetStyles.header}>
            <View style={sheetStyles.headerTitleWrap}>
              <ThemedText variant="title" style={sheetStyles.title}>
                Registrar Baixa / Ajuste
              </ThemedText>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                Descarte por perda, quebra ou acerto de contagem física
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn} accessibilityRole="button">
              <X size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={sheetStyles.formScroll}
            contentContainerStyle={sheetStyles.formScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText variant="caption" style={sheetStyles.label}>
              Insumo Selecionado
            </ThemedText>
            <View style={styles.insumoFixoBox}>
              <ThemedText variant="body" style={styles.insumoFixoNome}>
                {insumo.nome}
              </ThemedText>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                {insumo.localizacao || 'Estoque'} • Saldo atual: {formatarQuantidade(insumo.saldoAtual, insumo.unidadeMedida)}
              </ThemedText>
            </View>

            <ThemedText variant="caption" style={sheetStyles.label}>
              Motivo do Ajuste / Baixa
            </ThemedText>
            <View style={styles.motivosGrid}>
              {MOTIVOS.map((m) => {
                const isSelected = m.id === motivo;
                const IconComponent = m.Icon;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setMotivo(m.id)}
                    style={[styles.motivoPill, isSelected && styles.motivoPillActive]}
                    accessibilityRole="button"
                  >
                    <IconComponent size={15} color={isSelected ? tokens.colors.status.redText : tokens.colors.textMuted} />
                    <ThemedText variant="caption" style={[styles.motivoPillText, isSelected && styles.motivoPillTextActive]}>
                      {m.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText variant="caption" style={sheetStyles.label}>
              Quantidade a Baixar ({insumo.unidadeMedida}) *
            </ThemedText>
            <View style={[styles.inputContainer, isExcedente && styles.inputContainerError]}>
              <TextInput
                style={styles.inputFlex}
                placeholder={insumo.unidadeMedida.toLowerCase() === 'un' ? 'Ex: 2' : 'Ex: 0,50'}
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={quantidadeTexto}
                onChangeText={setQuantidadeTexto}
              />
              <ThemedText variant="body" style={styles.inputAdornment}>
                {insumo.unidadeMedida}
              </ThemedText>
            </View>

            {isExcedente ? (
              <View style={styles.feedbackAlerta}>
                <AlertTriangle size={14} color={tokens.colors.status.redText} />
                <ThemedText variant="caption" style={styles.feedbackAlertaTexto}>
                  Quantidade excede o saldo atual ({formatarQuantidade(insumo.saldoAtual, insumo.unidadeMedida)})
                </ThemedText>
              </View>
            ) : isQtdValida && saldoProjetado !== null ? (
              <View style={styles.feedbackProjecao}>
                <ThemedText variant="caption" style={styles.feedbackProjecaoTexto}>
                  Saldo projetado:{' '}
                  <ThemedText variant="caption" style={styles.destaqueAmbar}>
                    {formatarQuantidade(insumo.saldoAtual, insumo.unidadeMedida)} → {formatarQuantidade(saldoProjetado, insumo.unidadeMedida)}
                  </ThemedText>
                </ThemedText>
              </View>
            ) : null}

            <ThemedText variant="caption" style={sheetStyles.label}>
              Justificativa / Observação (Opcional)
            </ThemedText>
            <TextInput
              style={[sheetStyles.input, styles.inputMultiline]}
              placeholder="Ex: Embalagem danificada ou validade"
              placeholderTextColor={tokens.colors.textMuted}
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
            />

            <ModalAuditCallout />
          </ScrollView>

          <View style={[sheetStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity style={sheetStyles.cancelarButton} onPress={onClose} disabled={isEnviando}>
              <ThemedText variant="body" style={sheetStyles.cancelarText}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                sheetStyles.confirmarButton,
                { backgroundColor: tokens.colors.status.redText },
                !isFormValido && sheetStyles.buttonDisabled,
              ]}
              onPress={handleConfirmar}
              disabled={!isFormValido}
            >
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <ThemedText variant="body" style={sheetStyles.confirmarText}>
                  {!isApiOnline ? 'Conexão necessária' : 'Confirmar Baixa'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  insumoFixoBox: {
    backgroundColor: '#F8F9FA',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  insumoFixoNome: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  motivosGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    flexWrap: 'wrap',
  },
  motivoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 7,
    borderRadius: tokens.radii.full,
    backgroundColor: '#F1F3F4',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 36,
  },
  motivoPillActive: {
    backgroundColor: '#FDE8E8',
    borderColor: tokens.colors.status.redText,
  },
  motivoPillText: {
    color: tokens.colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  motivoPillTextActive: {
    color: tokens.colors.status.redText,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    height: 46,
  },
  inputContainerError: { borderColor: tokens.colors.status.redText, backgroundColor: '#FEF2F2' },
  inputFlex: { flex: 1, height: 46, fontSize: tokens.typography.fontMd, color: tokens.colors.textPrimary },
  inputMultiline: { height: 64, paddingVertical: tokens.spacing.xs, textAlignVertical: 'top' },
  inputAdornment: { color: tokens.colors.textMuted, fontWeight: '600', paddingLeft: tokens.spacing.xs },
  feedbackProjecao: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feedbackProjecaoTexto: { color: '#92400E', fontWeight: '600' },
  destaqueAmbar: { color: '#B45309', fontWeight: '800' },
  feedbackAlerta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 2 },
  feedbackAlertaTexto: { color: tokens.colors.status.redText, fontWeight: '600', flex: 1 },
});
