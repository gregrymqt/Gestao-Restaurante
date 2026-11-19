import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { SugestaoReposicaoInsumo } from '../types';
import { OrdemCompraItemRow } from './OrdemCompraItemRow';

interface OrdemCompraModalProps {
  visible: boolean;
  sugestoes: SugestaoReposicaoInsumo[];
  insumoFocoId?: string | null;
  onClose: () => void;
  onConfirmar: (pedido: {
    insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
    valorTotal: number;
  }) => Promise<void>;
  isEnviando?: boolean;
}

export function OrdemCompraModal({
  visible,
  sugestoes,
  insumoFocoId,
  onClose,
  onConfirmar,
  isEnviando = false,
}: OrdemCompraModalProps) {
  const itensParaComprar = sugestoes.filter((s) => s.quantidadeComprar > 0);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, boolean>>({});
  const [qtdOverrides, setQtdOverrides] = useState<Record<string, number>>({});
  const isApiOnline = useConnectionStore((s) => s.isApiOnline);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;

    const initialSel: Record<string, boolean> = {};
    const initialQtd: Record<string, number> = {};
    if (insumoFocoId) {
      const focoExiste = itensParaComprar.some((i) => i.insumoId === insumoFocoId);
      itensParaComprar.forEach((i) => {
        initialSel[i.insumoId] = focoExiste ? i.insumoId === insumoFocoId : true;
        initialQtd[i.insumoId] = i.quantidadeComprar;
      });
    } else {
      itensParaComprar.forEach((i) => {
        initialSel[i.insumoId] = true;
        initialQtd[i.insumoId] = i.quantidadeComprar;
      });
    }
    setItensSelecionados(initialSel);
    setQtdOverrides(initialQtd);
  }, [visible, sugestoes, insumoFocoId]);

  const toggleItem = (insumoId: string) => {
    setItensSelecionados((prev) => ({
      ...prev,
      [insumoId]: !prev[insumoId],
    }));
  };

  const handleQtdChange = (insumoId: string, novaQtd: number) => {
    setQtdOverrides((prev) => ({
      ...prev,
      [insumoId]: novaQtd,
    }));
  };

  const valorTotal = itensParaComprar
    .filter((i) => itensSelecionados[i.insumoId])
    .reduce((acc, i) => {
      const qtd = qtdOverrides[i.insumoId] ?? i.quantidadeComprar;
      return acc + qtd * (i.precoEstimadoUnitario || 35.0);
    }, 0);

  const countSelecionados = itensParaComprar.filter(
    (i) => itensSelecionados[i.insumoId]
  ).length;

  const handleConfirmar = async () => {
    const selecionados = itensParaComprar
      .filter((i) => itensSelecionados[i.insumoId])
      .map((i) => ({
        insumoId: i.insumoId,
        nomeInsumo: i.nomeInsumo,
        quantidade: qtdOverrides[i.insumoId] ?? i.quantidadeComprar,
        unidadeMedida: i.unidadeMedida,
      }));

    await onConfirmar({
      insumos: selecionados,
      valorTotal,
    });
  };

  const isBotaoConfirmarDesabilitado =
    isEnviando || valorTotal === 0 || countSelecionados === 0 || !isApiOnline;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View style={styles.dragIndicator} />
            <ThemedText variant="title" style={styles.title}>
              Ordem de Compra Sugerida
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.subtitle}>
              Reposição preditiva calculada para eliminar risco de ruptura
            </ThemedText>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            <ThemedText variant="body" style={styles.sectionTitle}>
              Insumos Deficitários
            </ThemedText>

            {itensParaComprar.map((item) => (
              <OrdemCompraItemRow
                key={item.insumoId}
                item={item}
                isChecked={!!itensSelecionados[item.insumoId]}
                qtdOverride={qtdOverrides[item.insumoId]}
                onToggle={toggleItem}
                onChangeQtd={handleQtdChange}
              />
            ))}

            <View style={styles.fornecedorBox}>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                Fornecedor Homologado:
              </ThemedText>
              <ThemedText variant="body" style={styles.fornecedorNome}>
                Distribuidora Prime Carnes & Panificação Express
              </ThemedText>
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                Prazo estimado de entrega: D+0 até às 18:00
              </ThemedText>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, tokens.spacing.md) }]}>
            <View style={styles.totalRow}>
              <ThemedText variant="body" color={tokens.colors.textMuted}>
                Custo Total Estimado:
              </ThemedText>
              <ThemedText variant="title" style={styles.totalValor}>
                {formatarMoeda(valorTotal)}
              </ThemedText>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                disabled={isEnviando}
                style={styles.cancelarButton}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <ThemedText variant="body" style={styles.cancelarText}>
                  Voltar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmar}
                disabled={isBotaoConfirmarDesabilitado}
                style={[
                  styles.confirmarButton,
                  isBotaoConfirmarDesabilitado && styles.buttonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  !isApiOnline
                    ? 'Sem conexão com a internet'
                    : `Confirmar Envio com ${countSelecionados} itens selecionados`
                }
              >
                {isEnviando ? (
                  <ActivityIndicator color={tokens.colors.white} />
                ) : !isApiOnline ? (
                  <View style={styles.offlineRow}>
                    <Ionicons name="cloud-offline-outline" size={16} color={tokens.colors.white} />
                    <ThemedText variant="body" style={styles.confirmarText}>
                      Sem Conexão
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText variant="body" style={styles.confirmarText}>
                    Confirmar Envio ({countSelecionados})
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
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
    maxHeight: '85%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: tokens.spacing.sm,
  },
  header: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
  },
  scrollList: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
  fornecedorBox: {
    backgroundColor: '#F8F9FA',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  fornecedorNome: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  totalValor: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
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
    flex: 3,
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
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
