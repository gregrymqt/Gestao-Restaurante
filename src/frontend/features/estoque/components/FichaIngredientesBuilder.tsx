import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Plus, Trash2, ChevronDown, Check, X, Search } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { AppDialog } from '@/shared/components/AppDialog';
import { InsumoEstoque } from '../types';

export interface ItemIngredienteForm {
  insumoId: string;
  nome: string;
  quantidade: number;
  unidadeMedida: string;
  custoUnitario: number;
}

interface FichaIngredientesBuilderProps {
  todosInsumos: InsumoEstoque[];
  ingredientes: ItemIngredienteForm[];
  onAdicionar: (item: ItemIngredienteForm) => void;
  onRemover: (insumoId: string) => void;
}

export function FichaIngredientesBuilder({
  todosInsumos,
  ingredientes,
  onAdicionar,
  onRemover,
}: FichaIngredientesBuilderProps) {
  const [insumoSelecionadoId, setInsumoSelecionadoId] = useState(
    todosInsumos.length > 0 ? todosInsumos[0].id : ''
  );
  const [quantidadeTexto, setQuantidadeTexto] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  const insumoAtual =
    todosInsumos.find((i) => i.id === insumoSelecionadoId) || todosInsumos[0];

  const handleAdicionar = () => {
    if (!insumoAtual) return;
    const qtd = parseFloat(quantidadeTexto.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      AppDialog.warning('Quantidade Inválida', 'Informe uma quantidade válida para o ingrediente.');
      return;
    }
    onAdicionar({
      insumoId: insumoAtual.id,
      nome: insumoAtual.nome,
      quantidade: qtd,
      unidadeMedida: insumoAtual.unidadeMedida,
      custoUnitario: insumoAtual.custoUnitarioMedio || 0,
    });
    setQuantidadeTexto('');
  };

  const insumosFiltrados = todosInsumos.filter((ins) => {
    if (!termoBusca.trim()) return true;
    const t = termoBusca.toLowerCase();
    return ins.nome.toLowerCase().includes(t) || ins.sku.toLowerCase().includes(t);
  });

  const textoInsumoAtual = insumoAtual
    ? `${insumoAtual.nome} (${insumoAtual.unidadeMedida.toUpperCase()} • R$ ${(insumoAtual.custoUnitarioMedio || 0).toFixed(2)})`
    : 'Selecione um insumo...';

  return (
    <View style={styles.container}>
      <ThemedText variant="caption" style={styles.secaoTitulo}>
        Adicionar Insumos à Composição
      </ThemedText>

      <View style={styles.addBox}>
        <ThemedText variant="caption" style={styles.subLabel}>
          Selecione o Insumo / Matéria-Prima
        </ThemedText>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsDropdownOpen(true)}
          style={styles.selectorButton}
          accessibilityRole="button"
          accessibilityLabel="Selecionar ingrediente"
        >
          <ThemedText variant="body" numberOfLines={1} style={styles.selectorButtonText}>
            {textoInsumoAtual}
          </ThemedText>
          <ChevronDown size={18} color={tokens.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.qtdRow}>
          <TextInput
            style={styles.qtdInput}
            placeholder={`Qtd (${insumoAtual?.unidadeMedida?.toUpperCase() || 'UN'})`}
            placeholderTextColor={tokens.colors.textMuted}
            keyboardType="numeric"
            value={quantidadeTexto}
            onChangeText={setQuantidadeTexto}
          />
          <TouchableOpacity onPress={handleAdicionar} style={styles.btnIncluir} activeOpacity={0.8}>
            <Plus size={16} color={tokens.colors.white} />
            <ThemedText variant="caption" style={styles.btnIncluirText}>
              Incluir Ingrediente
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ThemedText variant="caption" style={styles.secaoTitulo}>
        Ingredientes da Formulação ({ingredientes.length})
      </ThemedText>
      {ingredientes.length === 0 ? (
        <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.emptyText}>
          Nenhum ingrediente adicionado ainda à ficha técnica.
        </ThemedText>
      ) : (
        ingredientes.map((ing) => (
          <View key={ing.insumoId} style={styles.ingItem}>
            <View style={styles.ingInfo}>
              <ThemedText variant="body" style={styles.ingNome}>
                {ing.nome}
              </ThemedText>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                {ing.quantidade} {ing.unidadeMedida} • Custo: {formatarMoeda(ing.quantidade * ing.custoUnitario)}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => onRemover(ing.insumoId)} style={styles.btnRemover}>
              <Trash2 size={16} color={tokens.colors.status.redText} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <Modal visible={isDropdownOpen} animationType="fade" transparent onRequestClose={() => setIsDropdownOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="title" style={styles.modalTitle}>
                Selecionar Insumo
              </ThemedText>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color={tokens.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Search size={16} color={tokens.colors.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Filtrar por nome ou SKU..."
                placeholderTextColor={tokens.colors.textMuted}
                value={termoBusca}
                onChangeText={setTermoBusca}
                autoFocus
              />
            </View>

            <FlatList
              data={insumosFiltrados}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = item.id === (insumoSelecionadoId || todosInsumos[0]?.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setInsumoSelecionadoId(item.id);
                      setIsDropdownOpen(false);
                      setTermoBusca('');
                    }}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  >
                    <View style={styles.modalItemTextWrap}>
                      <ThemedText variant="body" style={[styles.modalItemNome, isSelected && styles.modalItemNomeActive]}>
                        {item.nome}
                      </ThemedText>
                      <ThemedText variant="caption" color={tokens.colors.textMuted}>
                        SKU {item.sku} • {item.unidadeMedida.toUpperCase()} • R$ {(item.custoUnitarioMedio || 0).toFixed(2)}
                      </ThemedText>
                    </View>
                    {isSelected && <Check size={18} color={tokens.colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: tokens.spacing.sm },
  secaoTitulo: { fontWeight: '800', color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm, marginBottom: 6 },
  subLabel: { fontWeight: '700', color: tokens.colors.textSecondary, marginBottom: 4, fontSize: 11 },
  addBox: { backgroundColor: '#F8F9FA', padding: tokens.spacing.sm, borderRadius: tokens.radii.md, borderWidth: 1, borderColor: tokens.colors.border, marginBottom: tokens.spacing.xs },
  selectorButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: tokens.colors.card, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radii.md, paddingHorizontal: tokens.spacing.sm, height: 44, marginBottom: 8 },
  selectorButtonText: { flex: 1, fontSize: 13, fontWeight: '600', color: tokens.colors.textPrimary, marginRight: 6 },
  qtdRow: { flexDirection: 'row', gap: tokens.spacing.xs },
  qtdInput: { flex: 1, backgroundColor: tokens.colors.card, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radii.md, paddingHorizontal: tokens.spacing.sm, height: 42, fontSize: tokens.typography.fontSm },
  btnIncluir: { flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.colors.primary, paddingHorizontal: 12, borderRadius: tokens.radii.md, gap: 4, height: 42 },
  btnIncluirText: { color: tokens.colors.white, fontWeight: '700', fontSize: 12 },
  emptyText: { fontStyle: 'italic', marginVertical: 6 },
  ingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: tokens.colors.card, padding: tokens.spacing.sm, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: tokens.colors.border, marginBottom: 4 },
  ingInfo: { flex: 1 },
  ingNome: { fontWeight: '700', fontSize: 13, color: tokens.colors.textPrimary },
  btnRemover: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: tokens.spacing.md },
  modalContent: { backgroundColor: tokens.colors.card, borderRadius: tokens.radii.lg, width: '100%', maxHeight: '75%', padding: tokens.spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.sm },
  modalTitle: { fontSize: 16, fontWeight: '800', color: tokens.colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: tokens.radii.md, paddingHorizontal: tokens.spacing.sm, height: 40, gap: 8, marginBottom: tokens.spacing.sm },
  modalSearchInput: { flex: 1, height: 40, fontSize: 13, color: tokens.colors.textPrimary },
  modalList: { maxHeight: 320 },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: tokens.spacing.xs, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemActive: { backgroundColor: '#FFF7ED' },
  modalItemTextWrap: { flex: 1, marginRight: 8 },
  modalItemNome: { fontWeight: '700', fontSize: 13, color: tokens.colors.textPrimary },
  modalItemNomeActive: { color: tokens.colors.primary },
});
