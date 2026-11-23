import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';
import { formatarQuantidade } from '@/shared/utils/formatters';
import { InsumoCriticoResumo } from '../types';

export interface OrdemPendenteResumo {
  protocolo: string;
  itens: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
  valorTotal: number;
}

interface AlertaEstoqueCriticoCardProps {
  insumos: readonly InsumoCriticoResumo[];
  ordemPendente?: OrdemPendenteResumo | null;
  onNavegarEstoque: () => void;
  onAbrirOrdemCompra?: () => void;
  onReceberOrdemCompra?: () => void;
  onVerOrdensCompra?: () => void;
  isRecebendo?: boolean;
}

export function AlertaEstoqueCriticoCard({
  insumos,
  ordemPendente,
  onNavegarEstoque,
  onAbrirOrdemCompra,
  onReceberOrdemCompra,
  onVerOrdensCompra,
  isRecebendo = false,
}: AlertaEstoqueCriticoCardProps) {
  if (!insumos || insumos.length === 0) {
    return null;
  }

  return (
    <View style={[styles.cardAlerta, ordemPendente && styles.cardAlertaEmTransito]}>
      <View style={styles.header}>
        <View style={styles.tituloRow}>
          <Ionicons
            name={ordemPendente ? 'cube-outline' : 'warning'}
            size={18}
            color={ordemPendente ? '#0284C7' : '#D97706'}
          />
          <ThemedText
            variant="subtitle"
            weight="bold"
            color={ordemPendente ? '#0369A1' : '#92400E'}
          >
            {ordemPendente
              ? `Reposição em Andamento (${ordemPendente.protocolo})`
              : `Atenção: ${insumos.length} ${insumos.length === 1 ? 'Insumo Crítico' : 'Insumos Críticos'}`}
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Ver estoque completo"
          onPress={onNavegarEstoque}
          style={styles.botaoVerMais}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ThemedText variant="caption" weight="bold" color="#B45309">
            Ver Estoque →
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText variant="caption" style={styles.descricao}>
        {ordemPendente
          ? 'Pedido enviado ao fornecedor. Dê entrada no estoque assim que a mercadoria for descarregada:'
          : 'Itens abaixo do estoque mínimo de segurança em tempo real:'}
      </ThemedText>

      <View style={styles.listaInsumos}>
        {insumos.map((item) => {
          const itemPendente = ordemPendente?.itens.find((i) => i.insumoId === item.id);

          return (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <View style={styles.itemNomeRow}>
                  <ThemedText variant="caption" weight="bold">
                    {item.nome}
                  </ThemedText>
                  {itemPendente && (
                    <View style={styles.badgeTransito}>
                      <ThemedText variant="caption" style={styles.badgeTransitoTexto}>
                        +{itemPendente.quantidade} {itemPendente.unidadeMedida || item.unidadeMedida} em trânsito
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText variant="caption" style={styles.itemMinimo}>
                  Mínimo exigido: {formatarQuantidade(item.quantidadeMinima, item.unidadeMedida)}
                </ThemedText>
              </View>

              <View style={styles.badgeQtd}>
                <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>
                  {formatarQuantidade(item.quantidadeAtual, item.unidadeMedida)}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      {ordemPendente ? (
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Dar entrada no estoque da ordem ${ordemPendente.protocolo}`}
          onPress={onReceberOrdemCompra}
          disabled={isRecebendo}
          style={[styles.botaoRecebimento, isRecebendo && styles.botaoDisabled]}
        >
          {isRecebendo ? (
            <ActivityIndicator color={tokens.colors.white} />
          ) : (
            <View style={styles.botaoOrdemCompraConteudo}>
              <Ionicons name="cube" size={18} color={tokens.colors.white} />
              <ThemedText variant="body" weight="bold" style={styles.botaoOrdemCompraTexto}>
                Dar Entrada no Estoque ({ordemPendente.protocolo})
              </ThemedText>
              <Ionicons name="checkmark-circle" size={16} color={tokens.colors.white} />
            </View>
          )}
        </TouchableOpacity>
      ) : onAbrirOrdemCompra ? (
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Gerar pedido de compra para insumos críticos"
          onPress={onAbrirOrdemCompra}
          style={styles.botaoOrdemCompra}
        >
          <View style={styles.botaoOrdemCompraConteudo}>
            <Ionicons name="document-text-outline" size={18} color={tokens.colors.white} />
            <ThemedText variant="body" weight="bold" style={styles.botaoOrdemCompraTexto}>
              Gerar Pedido de Compra ({insumos.length})
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color={tokens.colors.white} />
          </View>
        </TouchableOpacity>
      ) : null}

      {onVerOrdensCompra && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onVerOrdensCompra}
          style={styles.botaoVerOrdens}
          accessibilityRole="button"
          accessibilityLabel="Ver histórico e ordens de compra"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="clipboard-outline" size={16} color={tokens.colors.primary} />
          <ThemedText variant="body" weight="bold" color={tokens.colors.primary}>
            Ver Histórico e Ordens de Compra
          </ThemedText>
          <Ionicons name="arrow-forward" size={14} color={tokens.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardAlerta: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconeAlerta: {
    fontSize: 18,
  },
  botaoVerMais: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: tokens.radii.full,
  },
  descricao: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
    marginBottom: tokens.spacing.sm,
  },
  listaInsumos: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  itemInfo: {
    flex: 1,
  },
  itemMinimo: {
    fontSize: 10,
    color: tokens.colors.textMuted,
  },
  badgeQtd: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  botaoOrdemCompra: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.md,
    ...createShadow({ color: tokens.colors.primary, offsetY: 2, radius: 4, opacity: 0.25, elevation: 3 }),
  },
  botaoOrdemCompraConteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botaoOrdemCompraTexto: { color: tokens.colors.white, letterSpacing: 0.3 },
  cardAlertaEmTransito: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  itemNomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  badgeTransito: { backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: tokens.radii.sm },
  badgeTransitoTexto: { color: '#0284C7', fontSize: 10, fontWeight: '700' },
  botaoRecebimento: {
    backgroundColor: '#059669',
    borderRadius: tokens.radii.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.md,
    ...createShadow({ color: '#059669', offsetY: 2, radius: 4, opacity: 0.25, elevation: 3 }),
  },
  botaoDisabled: { opacity: 0.6 },
  botaoVerOrdens: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: tokens.radii.md,
    height: 44,
    minHeight: 44,
    marginTop: tokens.spacing.sm,
    gap: 6,
    ...createShadow({ offsetY: 1, radius: 2, opacity: 0.05, elevation: 1 }),
  },
});
