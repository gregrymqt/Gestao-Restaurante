import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { SugestaoReposicaoInsumo } from '../types';
import { OrdemCompraItemRow } from './OrdemCompraItemRow';

interface OrdemCompraModalProps {
  visible: boolean;
  sugestoes: SugestaoReposicaoInsumo[];
  onClose: () => void;
  onConfirmar: (pedido: {
    insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number }>;
    valorTotal: number;
  }) => Promise<void>;
  isEnviando?: boolean;
}

export function OrdemCompraModal({
  visible,
  sugestoes,
  onClose,
  onConfirmar,
  isEnviando = false,
}: OrdemCompraModalProps) {
  const itensParaComprar = sugestoes.filter((s) => s.quantidadeComprar > 0);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    itensParaComprar.forEach((i) => {
      initial[i.insumoId] = true;
    });
    return initial;
  });

  const toggleItem = (insumoId: string) => {
    setItensSelecionados((prev) => ({
      ...prev,
      [insumoId]: !prev[insumoId],
    }));
  };

  const valorTotal = itensParaComprar
    .filter((i) => itensSelecionados[i.insumoId])
    .reduce((acc, i) => acc + i.quantidadeComprar * (i.precoEstimadoUnitario || 35.0), 0);

  const handleConfirmar = async () => {
    const selecionados = itensParaComprar
      .filter((i) => itensSelecionados[i.insumoId])
      .map((i) => ({
        insumoId: i.insumoId,
        nomeInsumo: i.nomeInsumo,
        quantidade: i.quantidadeComprar,
      }));

    await onConfirmar({
      insumos: selecionados,
      valorTotal,
    });
  };

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
              Reposição preditiva calculada para eliminar risco de ruptura (D+1)
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
                onToggle={toggleItem}
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

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <ThemedText variant="body" color={tokens.colors.textMuted}>
                Custo Total Estimado:
              </ThemedText>
              <ThemedText variant="title" style={styles.totalValor}>
                R$ {valorTotal.toFixed(2).replace('.', ',')}
              </ThemedText>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                disabled={isEnviando}
                style={styles.cancelarButton}
              >
                <ThemedText variant="body" style={styles.cancelarText}>
                  Voltar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmar}
                disabled={isEnviando || valorTotal === 0}
                style={[
                  styles.confirmarButton,
                  (isEnviando || valorTotal === 0) && styles.buttonDisabled,
                ]}
              >
                {isEnviando ? (
                  <ActivityIndicator color={tokens.colors.white} />
                ) : (
                  <ThemedText variant="body" style={styles.confirmarText}>
                    Confirmar Envio
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
    paddingBottom: tokens.spacing.lg,
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
