import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { CadastrarInsumoInput } from '../types';

interface ModalNovoInsumoProps {
  visible: boolean;
  onClose: () => void;
  onConfirmar: (dados: CadastrarInsumoInput) => Promise<void>;
  isEnviando?: boolean;
}

const CATEGORIAS_PADRAO = [
  'Proteínas / Carnes',
  'Panificação',
  'Laticínios',
  'Hortifrúti',
  'Bebidas / Embalagens',
  'Geral / Mercearia',
];

const UNIDADES_PADRAO = ['UN', 'KG', 'L', 'G'];

export function ModalNovoInsumo({
  visible,
  onClose,
  onConfirmar,
  isEnviando = false,
}: ModalNovoInsumoProps) {
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
      Alert.alert('Campo Obrigatório', 'Informe o nome do insumo.');
      return;
    }

    const custo = parseFloat(custoTexto.replace(',', '.'));
    if (isNaN(custo) || custo < 0) {
      Alert.alert('Valor Inválido', 'Informe um custo unitário válido (>= 0).');
      return;
    }

    const minimo = parseFloat(minimoTexto.replace(',', '.'));
    if (isNaN(minimo) || minimo < 0) {
      Alert.alert('Valor Inválido', 'Informe um estoque mínimo válido (>= 0).');
      return;
    }

    const saldoInicial = saldoInicialTexto.trim()
      ? parseFloat(saldoInicialTexto.replace(',', '.'))
      : undefined;

    if (saldoInicial !== undefined && (isNaN(saldoInicial) || saldoInicial < 0)) {
      Alert.alert('Valor Inválido', 'O saldo inicial não pode ser negativo.');
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
      resetForm();
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'Erro ao cadastrar insumo.';
      Alert.alert('Erro ao Salvar Insumo', String(msg));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>Novo Insumo / Matéria-Prima</ThemedText>
              <ThemedText style={styles.subtitle}>Cadastre ingredientes para receitas e controle de saldos</ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nome do Insumo *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Bacon Fatiado, Molho Barbecue, Queijo Gouda"
                placeholderTextColor={tokens.colors.textMuted}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Categoria</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                {CATEGORIAS_PADRAO.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pill, categoria === cat && styles.pillSelected]}
                    onPress={() => setCategoria(cat)}
                  >
                    <ThemedText style={[styles.pillText, categoria === cat && styles.pillTextSelected]}>
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Unidade de Medida *</ThemedText>
              <View style={styles.rowPills}>
                {UNIDADES_PADRAO.map((un) => (
                  <TouchableOpacity
                    key={un}
                    style={[styles.unPill, unidadeMedida === un && styles.unPillSelected]}
                    onPress={() => setUnidadeMedida(un)}
                  >
                    <ThemedText style={[styles.unPillText, unidadeMedida === un && styles.unPillTextSelected]}>
                      {un}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <ThemedText style={styles.label}>Custo Unit. (R$) *</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="0,00"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                  value={custoTexto}
                  onChangeText={setCustoTexto}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <ThemedText style={styles.label}>Estoque Mínimo *</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                  value={minimoTexto}
                  onChangeText={setMinimoTexto}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Saldo Inicial no Estoque (Opcional)</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 10 (gera lançamento inicial no livro-razão)"
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={saldoInicialTexto}
                onChangeText={setSaldoInicialTexto}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancelar} onPress={handleClose} disabled={isEnviando}>
              <ThemedText style={styles.btnCancelarText}>Cancelar</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnConfirmar} onPress={handleSalvar} disabled={isEnviando}>
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} size="small" />
              ) : (
                <ThemedText style={styles.btnConfirmarText}>Cadastrar Insumo</ThemedText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  dragPill: {
    width: 44,
    height: 5,
    backgroundColor: tokens.colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: tokens.colors.textSecondary,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: tokens.colors.textPrimary,
  },
  pillsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
  rowPills: {
    flexDirection: 'row',
    gap: 10,
  },
  unPill: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  unPillSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  unPillText: {
    fontSize: 13,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },
  unPillTextSelected: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
  },
  btnCancelarText: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  btnConfirmar: {
    flex: 2,
    backgroundColor: tokens.colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnConfirmarText: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.white,
  },
});
