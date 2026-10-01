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
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { AppDialog } from '@/shared/components/AppDialog';
import { formatarMoedaInput } from '@/shared/utils/formatters';
import { InsumoEstoque, EntradaEstoqueInput } from '../types';
import { InsumoSelectorScroll } from './InsumoSelectorScroll';
import { ModalAuditCallout } from './ModalAuditCallout';

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
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);
  const [insumoSelecionadoId, setInsumoSelecionadoId] = useState<string>('');
  const [quantidadeTexto, setQuantidadeTexto] = useState<string>('');
  const [custoTexto, setCustoTexto] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (insumoInicial) {
        setInsumoSelecionadoId(insumoInicial.id);
        setCustoTexto(
          insumoInicial.custoUnitarioMedio
            ? formatarMoedaInput(String(Math.round(insumoInicial.custoUnitarioMedio * 100)))
            : ''
        );
      } else if (todosInsumos.length > 0) {
        setInsumoSelecionadoId(todosInsumos[0].id);
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

  const insumoAtual = todosInsumos.find((i) => i.id === insumoSelecionadoId) || insumoInicial;

  const handleInsumoChange = (id: string) => {
    setInsumoSelecionadoId(id);
    const item = todosInsumos.find((i) => i.id === id);
    if (item && item.custoUnitarioMedio) {
      setCustoTexto(formatarMoedaInput(String(Math.round(item.custoUnitarioMedio * 100))));
    }
  };

  const handleConfirmar = async () => {
    const qtd = parseFloat(quantidadeTexto.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      AppDialog.warning('Valor Inválido', 'Informe uma quantidade válida e positiva.');
      return;
    }

    if (!insumoSelecionadoId) {
      AppDialog.warning('Seleção Obrigatória', 'Selecione o insumo para registro de entrada.');
      return;
    }

    const custo = custoTexto ? parseFloat(custoTexto.replace(/\./g, '').replace(',', '.')) : undefined;

    await onConfirmar({
      insumoId: insumoSelecionadoId,
      quantidade: qtd,
      custoUnitario: !isNaN(custo || NaN) ? custo : undefined,
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
              Registrar Entrada de Mercadoria
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Lançamento de mercadoria com auditoria de saldo
            </ThemedText>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Seletor Modular de Insumo */}
            <ThemedText variant="caption" style={styles.label}>
              Insumo de Destino
            </ThemedText>
            <InsumoSelectorScroll
              insumoInicial={insumoInicial}
              todosInsumos={todosInsumos}
              insumoSelecionadoId={insumoSelecionadoId}
              onSelectInsumo={handleInsumoChange}
            />

            {/* Quantidade Recebida */}
            <ThemedText variant="caption" style={styles.label}>
              Quantidade Recebida ({insumoAtual?.unidadeMedida || 'unid/kg'})
            </ThemedText>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={insumoAtual?.unidadeMedida === 'un' ? 'Ex: 10' : 'Ex: 10,50'}
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={quantidadeTexto}
                onChangeText={setQuantidadeTexto}
              />
              <ThemedText variant="body" style={styles.inputAdornment}>
                {insumoAtual?.unidadeMedida || ''}
              </ThemedText>
            </View>

            {/* Custo Unitário */}
            <ThemedText variant="caption" style={styles.label}>
              Custo Unitário de Aquisição (Opcional - R$)
            </ThemedText>
            <View style={styles.inputContainer}>
              <ThemedText variant="body" style={styles.inputPrefix}>
                R$
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={custoTexto}
                onChangeText={(t) => setCustoTexto(formatarMoedaInput(t))}
              />
            </View>

            {/* Observação / NFe */}
            <ThemedText variant="caption" style={styles.label}>
              Observação / NFe / Fornecedor (Opcional)
            </ThemedText>
            <TextInput
              style={[styles.input, styles.inputTextArea]}
              placeholder="Ex: NF-e 45892 - Fornecedor Frigorífico Sul"
              placeholderTextColor={tokens.colors.textMuted}
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={2}
            />

            {/* Callout de Auditoria Modular */}
            <ModalAuditCallout />
          </ScrollView>

          {/* Footer de Ações */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              disabled={isEnviando}
              style={styles.cancelarButton}
            >
              <ThemedText variant="body" style={styles.cancelarText}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirmar}
              disabled={isEnviando || !isApiOnline}
              style={[styles.confirmarButton, (isEnviando || !isApiOnline) && styles.buttonDisabled]}
            >
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <ThemedText variant="body" style={styles.confirmarText}>
                  {!isApiOnline ? 'Servidor Offline' : 'Confirmar Entrada'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '90%',
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
  formScroll: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  label: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 4,
    marginTop: tokens.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.sm,
    height: 48,
    marginBottom: tokens.spacing.sm,
  },
  inputPrefix: {
    fontWeight: '700',
    color: tokens.colors.textMuted,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  inputAdornment: {
    fontWeight: '700',
    color: tokens.colors.textMuted,
    marginLeft: 6,
  },
  inputTextArea: {
    height: 60,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
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
    minHeight: 48,
  },
  cancelarText: {
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
  confirmarButton: {
    flex: 2,
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmarText: {
    color: tokens.colors.white,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
