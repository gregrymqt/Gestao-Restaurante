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
import { CategoriaProduto, CriarProdutoInput, ItemFichaTecnicaInput } from '../types';
import { estoqueService, InsumoEstoque } from '@/features/estoque';
import {
  SecaoFichaTecnicaProduto,
  IngredienteLinha,
} from './SecaoFichaTecnicaProduto';
import { ModalNovoProdutoCategorias } from './ModalNovoProdutoCategorias';

interface ModalNovoProdutoProps {
  visible: boolean;
  onClose: () => void;
  onConfirmar: (dados: CriarProdutoInput) => Promise<void>;
  isEnviando?: boolean;
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
      AppDialog.warning('Sem Insumos', 'Nenhum insumo disponível no estoque para vincular.');
      return;
    }
    const jaSelecionados = new Set(ingredientes.map((i) => i.insumoId));
    const proximoDisponivel = insumosDisponiveis.find((i) => !jaSelecionados.has(i.id));

    if (!proximoDisponivel) {
      AppDialog.warning('Limite', 'Todos os insumos cadastrados já foram adicionados à receita.');
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
      AppDialog.warning('Campo Obrigatório', 'Informe o nome do produto.');
      return;
    }

    const preco = parseFloat(precoTexto.replace(',', '.'));
    if (isNaN(preco) || preco < 0) {
      AppDialog.warning('Valor Inválido', 'Informe um preço de venda válido (>= 0).');
      return;
    }

    const fichaTecnicaFormatada: ItemFichaTecnicaInput[] = [];
    for (const ing of ingredientes) {
      const qtd = parseFloat(ing.quantidadeTexto.replace(',', '.'));
      if (isNaN(qtd) || qtd <= 0) {
        AppDialog.warning('Quantidade Inválida', 'A quantidade de cada ingrediente na receita deve ser maior que zero.');
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
      AppDialog.error('Erro ao Salvar', String(msg));
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

            <ModalNovoProdutoCategorias
              categoriaSelecionada={categoria}
              onSelectCategoria={setCategoria}
            />

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
            <SecaoFichaTecnicaProduto
              ingredientes={ingredientes}
              insumosDisponiveis={insumosDisponiveis}
              carregandoInsumos={carregandoInsumos}
              onAdicionarIngrediente={adicionarLinhaIngrediente}
              onRemoverIngrediente={removerLinhaIngrediente}
              onAlterarQuantidade={alterarQuantidade}
            />
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
