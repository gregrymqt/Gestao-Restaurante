import React, { useState } from 'react';
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
import { AppDialog } from '@/shared/components/AppDialog';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { CadastrarInsumoInput } from '../types';
import { ModalNovoInsumoPills, CATEGORIAS_PADRAO } from './ModalNovoInsumoPills';
import { modalBottomSheetStyles as sheetStyles } from './modalBottomSheetStyles';

interface ModalNovoInsumoProps {
  visible: boolean;
  onClose: () => void;
  onConfirmar: (dados: CadastrarInsumoInput) => Promise<void>;
  isEnviando?: boolean;
}

export function ModalNovoInsumo({
  visible,
  onClose,
  onConfirmar,
  isEnviando = false,
}: ModalNovoInsumoProps) {
  const insets = useSafeAreaInsets();
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [unidadeMedida, setUnidadeMedida] = useState('UN');
  const [custoTexto, setCustoTexto] = useState('');
  const [minimoTexto, setMinimoTexto] = useState('');
  const [saldoInicialTexto, setSaldoInicialTexto] = useState('');

  const resetForm = () => {
    setNome('');
    setCategoria(CATEGORIAS_PADRAO[0]);
    setUnidadeMedida('UN');
    setCustoTexto('');
    setMinimoTexto('');
    setSaldoInicialTexto('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe o nome do insumo.');
      return;
    }
    const custo = parseFloat(custoTexto.replace(',', '.'));
    if (isNaN(custo) || custo < 0) {
      AppDialog.warning('Valor Inválido', 'Informe um custo unitário válido (>= 0).');
      return;
    }
    const minimo = parseFloat(minimoTexto.replace(',', '.'));
    if (isNaN(minimo) || minimo < 0) {
      AppDialog.warning('Valor Inválido', 'Informe um estoque mínimo válido (>= 0).');
      return;
    }
    const saldoInicial = saldoInicialTexto.trim()
      ? parseFloat(saldoInicialTexto.replace(',', '.'))
      : undefined;

    if (saldoInicial !== undefined && (isNaN(saldoInicial) || saldoInicial < 0)) {
      AppDialog.warning('Valor Inválido', 'O saldo inicial não pode ser negativo.');
      return;
    }

    try {
      await onConfirmar({
        nome: nome.trim(),
        categoria,
        unidadeMedida,
        custoUnitario: custo,
        estoqueMinimo: minimo,
        saldoInicial,
      });
      handleClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || 'Erro ao cadastrar insumo.';
      AppDialog.error('Erro ao Salvar Insumo', String(msg));
    }
  };

  const isDesabilitado = isEnviando || !isApiOnline;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={sheetStyles.overlay}>
        <View style={sheetStyles.sheetContainer}>
          <View style={sheetStyles.dragIndicator} />

          <View style={sheetStyles.header}>
            <View style={sheetStyles.headerTitleWrap}>
              <ThemedText style={sheetStyles.title}>Novo Insumo / Matéria-Prima</ThemedText>
              <ThemedText style={sheetStyles.subtitle}>
                Cadastre ingredientes para receitas e controle de saldos
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} style={sheetStyles.closeBtn} accessibilityRole="button">
              <X size={20} color={tokens.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={sheetStyles.formScroll}
            contentContainerStyle={sheetStyles.formScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputGroup}>
              <ThemedText style={sheetStyles.label}>Nome do Insumo *</ThemedText>
              <TextInput
                style={sheetStyles.input}
                placeholder="Ex: Bacon, Molho Barbecue..."
                placeholderTextColor={tokens.colors.textMuted}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <ModalNovoInsumoPills
              categoria={categoria}
              onSelectCategoria={setCategoria}
              unidadeMedida={unidadeMedida}
              onSelectUnidadeMedida={setUnidadeMedida}
            />

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <ThemedText style={sheetStyles.label}>Custo Unit. (R$) *</ThemedText>
                <TextInput
                  style={sheetStyles.input}
                  placeholder="0,00"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                  value={custoTexto}
                  onChangeText={setCustoTexto}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <ThemedText style={sheetStyles.label}>Estoque Mínimo *</ThemedText>
                <TextInput
                  style={sheetStyles.input}
                  placeholder="0"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                  value={minimoTexto}
                  onChangeText={setMinimoTexto}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={sheetStyles.label}>Saldo Inicial no Estoque (Opcional)</ThemedText>
              <TextInput
                style={sheetStyles.input}
                placeholder="Ex: 10 (lançamento inicial)"
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={saldoInicialTexto}
                onChangeText={setSaldoInicialTexto}
              />
            </View>
          </ScrollView>

          <View style={[sheetStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity style={sheetStyles.cancelarButton} onPress={handleClose} disabled={isEnviando}>
              <ThemedText style={sheetStyles.cancelarText}>Cancelar</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[sheetStyles.confirmarButton, isDesabilitado && sheetStyles.buttonDisabled]}
              onPress={handleSalvar}
              disabled={isDesabilitado}
            >
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} size="small" />
              ) : (
                <ThemedText style={sheetStyles.confirmarText}>
                  {!isApiOnline ? 'Conexão necessária' : 'Cadastrar Insumo'}
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
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
});
