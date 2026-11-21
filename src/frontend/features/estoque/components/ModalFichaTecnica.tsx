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
import { X, DollarSign, Percent } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { formatarMoeda, formatarMoedaInput } from '@/shared/utils/formatters';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { FichaTecnicaItem, FichaTecnicaInput, InsumoEstoque } from '../types';
import { FichaIngredientesBuilder, ItemIngredienteForm } from './FichaIngredientesBuilder';
import { modalBottomSheetStyles as sheetStyles } from './modalBottomSheetStyles';

interface ModalFichaTecnicaProps {
  visible: boolean;
  fichaEdicao: FichaTecnicaItem | null;
  todosInsumos: InsumoEstoque[];
  onClose: () => void;
  onSalvar: (dados: FichaTecnicaInput) => Promise<void>;
  isEnviando?: boolean;
}

export function ModalFichaTecnica({
  visible,
  fichaEdicao,
  todosInsumos,
  onClose,
  onSalvar,
  isEnviando = false,
}: ModalFichaTecnicaProps) {
  const insets = useSafeAreaInsets();
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);

  const [nomeProduto, setNomeProduto] = useState('');
  const [tempoPreparoTexto, setTempoPreparoTexto] = useState('10');
  const [precoBalcaoTexto, setPrecoBalcaoTexto] = useState('');
  const [ingredientes, setIngredientes] = useState<ItemIngredienteForm[]>([]);

  useEffect(() => {
    if (visible) {
      if (fichaEdicao) {
        setNomeProduto(fichaEdicao.nomeProduto);
        setTempoPreparoTexto(String(fichaEdicao.tempoPreparoMin || 10));
        setPrecoBalcaoTexto(
          fichaEdicao.precoBalcao
            ? formatarMoedaInput(String(Math.round(fichaEdicao.precoBalcao * 100)))
            : ''
        );
        const mapIngs: ItemIngredienteForm[] = fichaEdicao.ingredientes.map((ing) => {
          const matchInsumo = todosInsumos.find((i) => i.id === ing.insumoId);
          const qtdNum = parseFloat(ing.quantidade.replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
          return {
            insumoId: ing.insumoId,
            nome: ing.nome,
            quantidade: qtdNum,
            unidadeMedida: matchInsumo?.unidadeMedida || 'un',
            custoUnitario: matchInsumo?.custoUnitarioMedio || 0,
          };
        });
        setIngredientes(mapIngs);
      } else {
        setNomeProduto('');
        setTempoPreparoTexto('10');
        setPrecoBalcaoTexto('');
        setIngredientes([]);
      }
    }
  }, [visible, fichaEdicao, todosInsumos]);

  const precoBalcaoNum = precoBalcaoTexto
    ? parseFloat(precoBalcaoTexto.replace(/\./g, '').replace(',', '.'))
    : 0;

  const custoTotalInsumos = ingredientes.reduce(
    (acc, cur) => acc + cur.quantidade * cur.custoUnitario,
    0
  );

  const margemBrutaProjetada =
    precoBalcaoNum > 0
      ? Math.max(0, ((precoBalcaoNum - custoTotalInsumos) / precoBalcaoNum) * 100)
      : 0;

  const isMargemSaudavel = margemBrutaProjetada >= 30;
  const margemCor = isMargemSaudavel ? '#059669' : '#D97706';

  const handleAdicionarIngrediente = (novo: ItemIngredienteForm) => {
    const jaExiste = ingredientes.some((i) => i.insumoId === novo.insumoId);
    if (jaExiste) {
      setIngredientes((prev) =>
        prev.map((i) =>
          i.insumoId === novo.insumoId ? { ...i, quantidade: i.quantidade + novo.quantidade } : i
        )
      );
    } else {
      setIngredientes((prev) => [...prev, novo]);
    }
  };

  const handleRemoverIngrediente = (insumoId: string) => {
    setIngredientes((prev) => prev.filter((i) => i.insumoId !== insumoId));
  };

  const handleSalvar = async () => {
    if (!nomeProduto.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe o nome do prato / produto.');
      return;
    }
    if (ingredientes.length === 0) {
      AppDialog.warning('Receita Vazia', 'Adicione pelo menos 1 ingrediente à ficha técnica.');
      return;
    }
    await onSalvar({
      id: fichaEdicao?.id,
      produtoId: fichaEdicao?.produtoId,
      nomeProduto: nomeProduto.trim(),
      tempoPreparoMin: parseInt(tempoPreparoTexto, 10) || 10,
      precoBalcao: precoBalcaoNum,
      ingredientes: ingredientes.map((i) => ({
        insumoId: i.insumoId,
        nome: i.nome,
        quantidade: `${i.quantidade} ${i.unidadeMedida}`,
      })),
    });
  };

  const isFormValido = Boolean(nomeProduto.trim()) && ingredientes.length > 0 && isApiOnline && !isEnviando;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheetStyles.overlay}>
        <View style={sheetStyles.sheetContainer}>
          <View style={sheetStyles.dragIndicator} />

          <View style={sheetStyles.header}>
            <View style={sheetStyles.headerTitleWrap}>
              <ThemedText variant="title" style={sheetStyles.title}>
                {fichaEdicao ? 'Editar Ficha Técnica (BOM)' : 'Nova Ficha Técnica (BOM)'}
              </ThemedText>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                Vincule insumos com cálculo em tempo real de custo e margem
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
              Nome do Produto / Prato *
            </ThemedText>
            <TextInput
              style={sheetStyles.input}
              placeholder="Ex: Cheeseburger Duplo Artesanal"
              placeholderTextColor={tokens.colors.textMuted}
              value={nomeProduto}
              onChangeText={setNomeProduto}
            />

            <View style={styles.rowInputs}>
              <View style={styles.flex1}>
                <ThemedText variant="caption" style={sheetStyles.label}>
                  Tempo Preparo (min)
                </ThemedText>
                <TextInput
                  style={sheetStyles.input}
                  placeholder="10"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                  value={tempoPreparoTexto}
                  onChangeText={setTempoPreparoTexto}
                />
              </View>

              <View style={styles.flex1}>
                <ThemedText variant="caption" style={sheetStyles.label}>
                  Preço Balcão (R$)
                </ThemedText>
                <TextInput
                  style={sheetStyles.input}
                  placeholder="0,00"
                  placeholderTextColor={tokens.colors.textMuted}
                  keyboardType="numeric"
                  value={precoBalcaoTexto}
                  onChangeText={(t) => setPrecoBalcaoTexto(formatarMoedaInput(t))}
                />
              </View>
            </View>

            {/* KPIs em tempo real com Semântica Rigorosa (#111827 para custo e verde/âmbar para margem) */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <DollarSign size={14} color="#111827" />
                <ThemedText variant="caption" style={styles.kpiLabel}>
                  Custo Insumos:
                </ThemedText>
                <ThemedText variant="caption" style={styles.kpiValorNeutro}>
                  {formatarMoeda(custoTotalInsumos)}
                </ThemedText>
              </View>

              <View style={styles.kpiCard}>
                <Percent size={14} color={margemCor} />
                <ThemedText variant="caption" style={styles.kpiLabel}>
                  Margem Bruta:
                </ThemedText>
                <ThemedText variant="caption" style={[styles.kpiMargemValor, { color: margemCor }]}>
                  {margemBrutaProjetada.toFixed(1)}%
                </ThemedText>
              </View>
            </View>

            <FichaIngredientesBuilder
              todosInsumos={todosInsumos}
              ingredientes={ingredientes}
              onAdicionar={handleAdicionarIngrediente}
              onRemover={handleRemoverIngrediente}
            />
          </ScrollView>

          <View style={[sheetStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity onPress={onClose} disabled={isEnviando} style={sheetStyles.cancelarButton}>
              <ThemedText variant="body" style={sheetStyles.cancelarText}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSalvar}
              disabled={!isFormValido}
              style={[sheetStyles.confirmarButton, !isFormValido && sheetStyles.buttonDisabled]}
            >
              {isEnviando ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <ThemedText variant="body" style={sheetStyles.confirmarText}>
                  {!isApiOnline ? 'Conexão necessária' : 'Salvar Ficha Técnica'}
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
  rowInputs: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  kpiRow: { flexDirection: 'row', gap: 8, marginTop: tokens.spacing.xs, marginBottom: tokens.spacing.xs },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  kpiLabel: { fontWeight: '600', fontSize: 10, color: tokens.colors.textSecondary },
  kpiValorNeutro: { fontWeight: '800', fontSize: 11, color: '#111827' },
  kpiMargemValor: { fontWeight: '800', fontSize: 11 },
});
