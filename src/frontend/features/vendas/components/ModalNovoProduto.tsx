import React, { useState, useEffect } from 'react';
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
import { CategoriaProduto, CriarProdutoInput, ItemFichaTecnicaInput } from '../types';
import { estoqueService, InsumoEstoque } from '@/features/estoque';

interface ModalNovoProdutoProps {
  visible: boolean;
  onClose: () => void;
  onConfirmar: (dados: CriarProdutoInput) => Promise<void>;
  isEnviando?: boolean;
}

const CATEGORIAS_PRODUTO: CategoriaProduto[] = [
  'Hambúrgueres',
  'Porções',
  'Bebidas',
  'Sobremesas',
];

interface IngredienteLinha {
  insumoId: string;
  quantidadeTexto: string;
}

export function ModalNovoProduto({
  visible,
  onClose,
  onConfirmar,
  isEnviando = false,
}: ModalNovoProdutoProps) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto>('Hambúrgueres');
  const [precoTexto, setPrecoTexto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ingredientes, setIngredientes] = useState<IngredienteLinha[]>([]);
  const [insumosDisponiveis, setInsumosDisponiveis] = useState<InsumoEstoque[]>([]);
  const [carregandoInsumos, setCarregandoInsumos] = useState(false);

  useEffect(() => {
    if (visible) {
      setCarregandoInsumos(true);
      estoqueService
        .obterInsumos()
        .then((data) => setInsumosDisponiveis(data))
        .catch(() => setInsumosDisponiveis([]))
        .finally(() => setCarregandoInsumos(false));
    }
  }, [visible]);

  const resetForm = () => {
    setNome('');
    setCategoria('Hambúrgueres');
    setPrecoTexto('');
    setDescricao('');
    setIngredientes([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const adicionarLinhaIngrediente = () => {
    if (insumosDisponiveis.length === 0) {
      Alert.alert('Sem Insumos', 'Nenhum insumo disponível no estoque para vincular.');
      return;
    }
    const jaSelecionados = new Set(ingredientes.map((i) => i.insumoId));
    const proximoDisponivel = insumosDisponiveis.find((i) => !jaSelecionados.has(i.id));

    if (!proximoDisponivel) {
      Alert.alert('Limite', 'Todos os insumos cadastrados já foram adicionados à receita.');
      return;
    }

    setIngredientes([...ingredientes, { insumoId: proximoDisponivel.id, quantidadeTexto: '1' }]);
  };

  const removerLinhaIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const alterarQuantidade = (index: number, valor: string) => {
    const copia = [...ingredientes];
    copia[index] = { ...copia[index], quantidadeTexto: valor };
    setIngredientes(copia);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Campo Obrigatório', 'Informe o nome do produto.');
      return;
    }

    const preco = parseFloat(precoTexto.replace(',', '.'));
    if (isNaN(preco) || preco < 0) {
      Alert.alert('Valor Inválido', 'Informe um preço de venda válido (>= 0).');
      return;
    }

    const fichaTecnicaFormatada: ItemFichaTecnicaInput[] = [];
    for (const ing of ingredientes) {
      const qtd = parseFloat(ing.quantidadeTexto.replace(',', '.'));
      if (isNaN(qtd) || qtd <= 0) {
        Alert.alert('Quantidade Inválida', 'A quantidade de cada ingrediente na receita deve ser maior que zero.');
        return;
      }
      fichaTecnicaFormatada.push({
        insumoId: ing.insumoId,
        quantidade: qtd,
      });
    }

    try {
      await onConfirmar({
        nome: nome.trim(),
        preco,
        categoria,
        descricao: descricao.trim() || undefined,
        fichaTecnica: fichaTecnicaFormatada.length > 0 ? fichaTecnicaFormatada : undefined,
      });
      resetForm();
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'Erro ao cadastrar produto.';
      Alert.alert('Erro ao Salvar', String(msg));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>Novo Produto do Cardápio</ThemedText>
              <ThemedText style={styles.subtitle}>Adicione itens de venda e configure a receita de estoque</ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nome do Produto *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Cheddar Bacon Melt, Batata Supreme"
                placeholderTextColor={tokens.colors.textMuted}
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Categoria *</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                {CATEGORIAS_PRODUTO.map((cat) => (
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
              <ThemedText style={styles.label}>Preço de Venda (R$) *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="0,00"
                placeholderTextColor={tokens.colors.textMuted}
                keyboardType="numeric"
                value={precoTexto}
                onChangeText={setPrecoTexto}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Descrição Comercial (Opcional)</ThemedText>
              <TextInput
                style={[styles.textInput, styles.multiline]}
                placeholder="Detalhes dos ingredientes ou apresentação..."
                placeholderTextColor={tokens.colors.textMuted}
                multiline
                numberOfLines={2}
                value={descricao}
                onChangeText={setDescricao}
              />
            </View>

            {/* Seção Ficha Técnica Opcional */}
            <View style={styles.bomSection}>
              <View style={styles.bomHeaderRow}>
                <View>
                  <ThemedText style={styles.bomTitle}>Receita & Baixa de Estoque</ThemedText>
                  <ThemedText style={styles.bomSubtitle}>
                    {ingredientes.length === 0
                      ? 'Nenhum insumo (venda direta sem baixa de matéria-prima)'
                      : `${ingredientes.length} insumo(s) consumido(s) por venda`}
                  </ThemedText>
                </View>
                <TouchableOpacity style={styles.btnAddIngrediente} onPress={adicionarLinhaIngrediente}>
                  <ThemedText style={styles.btnAddIngredienteText}>+ Ingrediente</ThemedText>
                </TouchableOpacity>
              </View>

              {carregandoInsumos ? (
                <ActivityIndicator size="small" color={tokens.colors.primary} style={styles.loader} />
              ) : (
                ingredientes.map((linha, idx) => {
                  const insumo = insumosDisponiveis.find((i) => i.id === linha.insumoId);
                  return (
                    <View key={linha.insumoId} style={styles.ingredienteRow}>
                      <ThemedText style={styles.ingredienteNome} numberOfLines={1}>
                        {insumo?.nome || 'Insumo'}
                      </ThemedText>
                      <TextInput
                        style={styles.ingredienteQtdInput}
                        placeholder="Qtd"
                        keyboardType="numeric"
                        value={linha.quantidadeTexto}
                        onChangeText={(txt) => alterarQuantidade(idx, txt)}
                      />
                      <ThemedText style={styles.ingredienteUn}>
                        {insumo?.unidadeMedida || 'un'}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removerLinhaIngrediente(idx)} style={styles.btnRemoverIngrediente}>
                        <ThemedText style={styles.btnRemoverText}>✕</ThemedText>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
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
                <ThemedText style={styles.btnConfirmarText}>Cadastrar Produto</ThemedText>
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
    maxHeight: '92%',
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
  multiline: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  pillsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  bomSection: {
    backgroundColor: tokens.colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  bomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  bomSubtitle: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    marginTop: 2,
  },
  btnAddIngrediente: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnAddIngredienteText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  loader: {
    marginVertical: 10,
  },
  ingredienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 8,
  },
  ingredienteNome: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  ingredienteQtdInput: {
    width: 60,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'center',
    color: tokens.colors.textPrimary,
  },
  ingredienteUn: {
    fontSize: 12,
    color: tokens.colors.textSecondary,
    width: 25,
  },
  btnRemoverIngrediente: {
    padding: 6,
  },
  btnRemoverText: {
    fontSize: 14,
    color: tokens.colors.status.redText,
    fontWeight: '700',
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
