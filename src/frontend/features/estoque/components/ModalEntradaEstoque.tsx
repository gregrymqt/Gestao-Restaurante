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
import { X } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { AppDialog } from '@/shared/components/AppDialog';
import { formatarMoedaInput, formatarQuantidade, formatarMoeda } from '@/shared/utils/formatters';
import { InsumoEstoque, EntradaEstoqueInput } from '../types';
import { InsumoSelectorScroll } from './InsumoSelectorScroll';
import { ModalAuditCallout } from './ModalAuditCallout';
import { modalBottomSheetStyles as sheetStyles } from './modalBottomSheetStyles';

interface ModalEntradaEstoqueProps {
  visible: boolean;
  insumoInicial: InsumoEstoque | null;
  todosInsumos: InsumoEstoque[];
  onClose: () => void;
  onConfirmar: (dados: EntradaEstoqueInput) => Promise<void>;
  isEnviando?: boolean;
}

export function ModalEntradaEstoque({
  visible,
  insumoInicial,
  todosInsumos,
  onClose,
  onConfirmar,
  isEnviando = false,
}: ModalEntradaEstoqueProps) {
  const insets = useSafeAreaInsets();
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);

  const [insumoId, setInsumoId] = useState<string>('');
  const [quantidadeTexto, setQuantidadeTexto] = useState<string>('');
  const [custoTexto, setCustoTexto] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (insumoInicial) {
        setInsumoId(insumoInicial.id);
        setCustoTexto(
          insumoInicial.custoUnitarioMedio
            ? formatarMoedaInput(String(Math.round(insumoInicial.custoUnitarioMedio * 100)))
            : ''
        );
      } else if (todosInsumos.length > 0) {
        setInsumoId(todosInsumos[0].id);
        setCustoTexto(
          todosInsumos[0].custoUnitarioMedio
            ? formatarMoedaInput(String(Math.round(todosInsumos[0].custoUnitarioMedio * 100)))
            : ''
        );
      }
      setQuantidadeTexto('');
      setObservacao('');
    }
  }, [visible, insumoInicial, todosInsumos]);

  const insumoAtual = todosInsumos.find((i) => i.id === insumoId) || insumoInicial;

  const handleInsumoChange = (id: string) => {
    setInsumoId(id);
    const item = todosInsumos.find((i) => i.id === id);
    if (item && item.custoUnitarioMedio) {
      setCustoTexto(formatarMoedaInput(String(Math.round(item.custoUnitarioMedio * 100))));
    }
  };

  const qtd = parseFloat(quantidadeTexto.replace(',', '.'));
  const isQtdValida = !isNaN(qtd) && qtd > 0;
  const saldoAtual = insumoAtual?.saldoAtual ?? 0;
  const unidade = insumoAtual?.unidadeMedida || 'un';
  const novoSaldo = isQtdValida ? saldoAtual + qtd : null;

  const custoNum = custoTexto
    ? parseFloat(custoTexto.replace(/\./g, '').replace(',', '.'))
    : undefined;
  const totalEntrada =
    isQtdValida && custoNum && !isNaN(custoNum) && custoNum > 0 ? qtd * custoNum : null;

  const isFormValido = isQtdValida && Boolean(insumoId) && isApiOnline && !isEnviando;

  const handleConfirmar = async () => {
    if (!isQtdValida) {
      AppDialog.warning('Valor Inválido', 'Informe uma quantidade válida e positiva.');
      return;
    }
    if (!insumoId) {
      AppDialog.warning('Seleção Obrigatória', 'Selecione o insumo para registro de entrada.');
      return;
    }
    await onConfirmar({
      insumoId,
      quantidade: qtd,
      custoUnitario: custoNum && !isNaN(custoNum) ? custoNum : undefined,
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
                Registrar Entrada de Mercadoria
              </ThemedText>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                Lançamento de mercadoria com auditoria de saldo
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn} accessibilityRole="button" accessibilityLabel="Fechar modal">
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
              Insumo de Destino
            </ThemedText>
            <InsumoSelectorScroll
              insumoInicial={insumoInicial}
              todosInsumos={todosInsumos}
              insumoSelecionadoId={insumoId}
              onSelectInsumo={handleInsumoChange}
            />

            <ThemedText variant="caption" style={sheetStyles.label}>
              Quantidade Recebida ({unidade}) *
            </ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputFlex}
                placeholder={unidade.toLowerCase() === 'un' ? 'Ex: 10' : 'Ex: 10,50'}
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={quantidadeTexto}
                onChangeText={setQuantidadeTexto}
              />
              <ThemedText variant="body" style={styles.inputAdornment}>
                {unidade}
              </ThemedText>
            </View>

            {isQtdValida && novoSaldo !== null && (
              <View style={styles.feedbackProjecao}>
                <ThemedText variant="caption" style={styles.feedbackProjecaoTexto}>
                  Novo saldo:{' '}
                  <ThemedText variant="caption" style={styles.destaqueVerde}>
                    {formatarQuantidade(saldoAtual, unidade)} → {formatarQuantidade(novoSaldo, unidade)}
                  </ThemedText>
                </ThemedText>
              </View>
            )}

            <ThemedText variant="caption" style={sheetStyles.label}>
              Custo Unitário de Aquisição (Opcional - R$)
            </ThemedText>
            <View style={styles.inputContainer}>
              <ThemedText variant="body" style={styles.inputPrefix}>
                R$
              </ThemedText>
              <TextInput
                style={styles.inputFlex}
                placeholder="0,00"
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={custoTexto}
                onChangeText={(t) => setCustoTexto(formatarMoedaInput(t))}
              />
            </View>

            {totalEntrada !== null && (
              <View style={styles.feedbackCustoTotal}>
                <ThemedText variant="caption" style={styles.feedbackCustoTotalTexto}>
                  Total da Entrada:{' '}
                  <ThemedText variant="caption" style={styles.destaqueCustoTotal}>
                    {formatarMoeda(totalEntrada)}
                  </ThemedText>
                </ThemedText>
              </View>
            )}

            <ThemedText variant="caption" style={sheetStyles.label}>
              Observação / NFe / Fornecedor (Opcional)
            </ThemedText>
            <TextInput
              style={[sheetStyles.input, styles.inputTextArea]}
              placeholder="Ex: NF-e 45892 - Fornecedor Frigorífico Sul"
              placeholderTextColor={tokens.colors.textMuted}
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={2}
            />

            <ModalAuditCallout />
          </ScrollView>

          <View style={[sheetStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity onPress={onClose} disabled={isEnviando} style={sheetStyles.cancelarButton} accessibilityRole="button" accessibilityLabel="Cancelar entrada">
              <ThemedText variant="body" style={sheetStyles.cancelarText}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmar}
              disabled={!isFormValido}
              accessibilityRole="button"
              accessibilityLabel="Confirmar entrada"
              accessibilityState={{ disabled: !isFormValido }}
              style={[sheetStyles.confirmarButton, !isFormValido && sheetStyles.buttonDisabled]}
            >
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <ThemedText
                  variant="body"
                  style={[sheetStyles.confirmarText, !isFormValido && sheetStyles.buttonDisabledText]}
                >
                  {!isApiOnline ? 'Conexão necessária' : 'Confirmar Entrada'}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.sm,
    height: 46,
    marginBottom: 4,
  },
  inputPrefix: { fontWeight: '700', color: tokens.colors.textMuted, marginRight: 6 },
  inputFlex: { flex: 1, fontSize: tokens.typography.fontMd, color: tokens.colors.textPrimary },
  inputAdornment: { fontWeight: '700', color: tokens.colors.textMuted, marginLeft: 6 },
  feedbackProjecao: {
    marginBottom: tokens.spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feedbackProjecaoTexto: { color: '#047857', fontWeight: '600' },
  destaqueVerde: { color: '#065F46', fontWeight: '800' },
  feedbackCustoTotal: {
    marginBottom: tokens.spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackCustoTotalTexto: { color: tokens.colors.textPrimary, fontWeight: '600' },
  destaqueCustoTotal: { color: tokens.colors.primary, fontWeight: '800' },
  inputTextArea: { height: 56, paddingVertical: tokens.spacing.xs, marginBottom: tokens.spacing.sm, textAlignVertical: 'top' },
});
