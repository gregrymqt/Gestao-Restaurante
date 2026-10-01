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
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { formatarQuantidade } from '@/shared/utils/formatters';
import { InsumoEstoque, BaixaEstoqueInput, MotivoBaixaEstoque } from '../types';
import { ModalAuditCallout } from './ModalAuditCallout';

interface ModalBaixaEstoqueProps {
  visible: boolean;
  insumo: InsumoEstoque | null;
  onClose: () => void;
  onConfirmar: (dados: BaixaEstoqueInput) => Promise<void>;
  isEnviando?: boolean;
}

const MOTIVOS_BAIXA: Array<{ id: MotivoBaixaEstoque; label: string; icone: string }> = [
  { id: 'Avaria', label: 'Avaria / Quebra', icone: '💔' },
  { id: 'Validade', label: 'Validade Vencida', icone: '⏰' },
  { id: 'Inventario', label: 'Ajuste Inventário', icone: '📋' },
];

export function ModalBaixaEstoque({
  visible,
  insumo,
  onClose,
  onConfirmar,
  isEnviando = false,
}: ModalBaixaEstoqueProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<MotivoBaixaEstoque>('Avaria');
  const [quantidadeTexto, setQuantidadeTexto] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (visible) {
      setMotivoSelecionado('Avaria');
      setQuantidadeTexto('');
      setObservacao('');
    }
  }, [visible]);

  if (!insumo) return null;

  const handleConfirmar = async () => {
    const qtd = parseFloat(quantidadeTexto.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      AppDialog.warning('Quantidade Inválida', 'Informe uma quantidade válida e maior que zero para baixa.');
      return;
    }

    if (qtd > insumo.saldoAtual) {
      AppDialog.warning(
        'Saldo Insuficiente',
        `A baixa de ${formatarQuantidade(qtd, insumo.unidadeMedida)} não pode superar o saldo atual em estoque (${formatarQuantidade(insumo.saldoAtual, insumo.unidadeMedida)}).`
      );
      return;
    }

    await onConfirmar({
      insumoId: insumo.id,
      quantidade: qtd,
      motivo: motivoSelecionado,
      observacao: observacao.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <ThemedText variant="title" style={styles.title}>
              Registrar Baixa / Ajuste
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Descarte por perda, quebra ou acerto de contagem física
            </ThemedText>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Insumo Selecionado Fixo (Padrão Imagem 4) */}
            <ThemedText variant="caption" style={styles.label}>
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

            {/* Motivo da Baixa */}
            <ThemedText variant="caption" style={styles.label}>
              Motivo do Ajuste / Baixa
            </ThemedText>
            <View style={styles.motivosGrid}>
              {MOTIVOS_BAIXA.map((m) => {
                const isSelected = m.id === motivoSelecionado;
                return (
                  <TouchableOpacity
                    key={m.id}
                    activeOpacity={0.8}
                    onPress={() => setMotivoSelecionado(m.id)}
                    style={[styles.motivoPill, isSelected && styles.motivoPillActive]}
                  >
                    <ThemedText style={styles.motivoIcon}>{m.icone}</ThemedText>
                    <ThemedText
                      variant="caption"
                      style={[styles.motivoPillText, isSelected && styles.motivoPillTextActive]}
                    >
                      {m.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantidade a Baixar */}
            <ThemedText variant="caption" style={styles.label}>
              Quantidade a Baixar ({insumo.unidadeMedida})
            </ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={insumo.unidadeMedida === 'un' ? 'Ex: 2' : 'Ex: 0,50'}
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={quantidadeTexto}
                onChangeText={setQuantidadeTexto}
              />
              <ThemedText variant="body" style={styles.inputAdornment}>
                {insumo.unidadeMedida}
              </ThemedText>
            </View>

            {/* Justificativa / Observação */}
            <ThemedText variant="caption" style={styles.label}>
              Justificativa / Observação (Opcional)
            </ThemedText>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Ex: Embalagem danificada no transporte ou lote vencido"
              placeholderTextColor={tokens.colors.textMuted}
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
            />

            {/* Aviso de Auditoria e Reconciliação */}
            <ModalAuditCallout />
          </ScrollView>

          {/* Rodapé com Ações */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={onClose}
              disabled={isEnviando}
              activeOpacity={0.8}
            >
              <ThemedText variant="body" color={tokens.colors.textMuted}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnConfirmar, isEnviando && styles.btnConfirmarDisabled]}
              onPress={handleConfirmar}
              disabled={isEnviando}
              activeOpacity={0.8}
            >
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <ThemedText variant="body" style={styles.btnConfirmarText}>
                  Confirmar Baixa
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '85%',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xl,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.border,
    alignSelf: 'center',
    marginBottom: tokens.spacing.sm,
  },
  header: {
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  formScroll: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 6,
    marginTop: tokens.spacing.sm,
  },
  insumoFixoBox: {
    backgroundColor: '#F8F9FA',
    padding: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  insumoFixoNome: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 2,
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
    paddingVertical: 8,
    borderRadius: tokens.radii.full,
    backgroundColor: '#F1F3F4',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  motivoPillActive: {
    backgroundColor: '#FDE8E8',
    borderColor: tokens.colors.status.redText,
  },
  motivoIcon: {
    fontSize: 14,
  },
  motivoPillText: {
    color: tokens.colors.textMuted,
    fontWeight: '600',
    fontSize: tokens.typography.fontXs,
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
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  inputMultiline: {
    height: 72,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    textAlignVertical: 'top',
  },
  inputAdornment: {
    color: tokens.colors.textMuted,
    fontWeight: '600',
    paddingLeft: tokens.spacing.xs,
  },
  footerActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.xs,
  },
  btnCancelar: {
    flex: 1,
    height: 48,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmar: {
    flex: 1.5,
    height: 48,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.status.redText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmarDisabled: {
    opacity: 0.6,
  },
  btnConfirmarText: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
});
