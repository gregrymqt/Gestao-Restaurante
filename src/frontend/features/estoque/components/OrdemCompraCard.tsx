import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  CheckCircle2,
  Clock,
  Ban,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';
import { OrdemCompraDetalhe } from '@/features/previsoes/types';

interface OrdemCompraCardProps {
  ordem: OrdemCompraDetalhe;
  onMarcarComprada: (ordem: OrdemCompraDetalhe) => void;
  onReceberOrdem: (ordem: OrdemCompraDetalhe) => void;
  onCancelarOrdem: (ordem: OrdemCompraDetalhe) => void;
}

export function OrdemCompraCard({
  ordem,
  onMarcarComprada,
  onReceberOrdem,
  onCancelarOrdem,
}: OrdemCompraCardProps) {
  const [expandido, setExpandido] = useState(false);

  const isPendente = ordem.status === 'PENDENTE';
  const isAprovada = ordem.status === 'APROVADA';
  const isRecebida = ordem.status === 'RECEBIDA';
  const isCancelada = ordem.status === 'CANCELADA';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpandido(!expandido)}
        style={styles.cardHeader}
      >
        <View style={styles.headerInfo}>
          <View style={styles.protocoloRow}>
            <ThemedText variant="body" weight="bold" color={tokens.colors.textPrimary}>
              {ordem.protocolo}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                isPendente && styles.badgePendente,
                isAprovada && styles.badgeAprovada,
                isRecebida && styles.badgeRecebida,
                isCancelada && styles.badgeCancelada,
              ]}
            >
              {isPendente && <Clock size={12} color="#D97706" />}
              {isAprovada && <CheckCircle2 size={12} color="#2563EB" />}
              {isRecebida && <PackageCheck size={12} color="#16A34A" />}
              {isCancelada && <Ban size={12} color="#DC2626" />}
              <ThemedText
                variant="caption"
                weight="bold"
                style={[
                  styles.statusTexto,
                  isPendente && styles.textoPendente,
                  isAprovada && styles.textoAprovada,
                  isRecebida && styles.textoRecebida,
                  isCancelada && styles.textoCancelada,
                ]}
              >
                {isPendente ? 'Pendente' : isAprovada ? 'Comprada' : isRecebida ? 'Recebida' : 'Cancelada'}
              </ThemedText>
            </View>
          </View>

          <ThemedText variant="caption" color={tokens.colors.textMuted}>
            {new Date(ordem.criadoEm).toLocaleDateString('pt-BR')} às{' '}
            {new Date(ordem.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>

        <View style={styles.headerRight}>
          <ThemedText variant="body" weight="bold" color={tokens.colors.primary}>
            R$ {ordem.valorTotalEstimado.toFixed(2)}
          </ThemedText>
          {expandido ? (
            <ChevronUp size={18} color={tokens.colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={tokens.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {ordem.fornecedor ? (
        <View style={styles.fornecedorRow}>
          <Building2 size={14} color={tokens.colors.textSecondary} />
          <ThemedText variant="caption" color={tokens.colors.textSecondary}>
            Fornecedor: <ThemedText variant="caption" weight="bold">{ordem.fornecedor}</ThemedText>
          </ThemedText>
        </View>
      ) : null}

      {ordem.observacao ? (
        <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.observacaoTexto}>
          Obs: {ordem.observacao}
        </ThemedText>
      ) : null}

      {expandido ? (
        <View style={styles.itensBox}>
          <ThemedText variant="caption" weight="bold" color={tokens.colors.textSecondary}>
            Itens ({ordem.itens.length}):
          </ThemedText>
          {ordem.itens.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <ThemedText variant="caption" color={tokens.colors.textPrimary}>
                {it.nomeInsumo} ({it.quantidade} {it.unidadeMedida})
              </ThemedText>
              <ThemedText variant="caption" weight="medium" color={tokens.colors.textSecondary}>
                R$ {it.subtotalEstimado.toFixed(2)}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.acoesRow}>
        {isPendente && (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onCancelarOrdem(ordem)}
              accessibilityRole="button"
              accessibilityLabel={`Cancelar ordem ${ordem.protocolo}`}
              style={styles.btnCancelar}
            >
              <ThemedText variant="caption" weight="bold" color="#DC2626">
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onMarcarComprada(ordem)}
              accessibilityRole="button"
              accessibilityLabel={`Marcar ordem ${ordem.protocolo} como comprada`}
              style={styles.btnComprada}
            >
              <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
                Marcar como Comprada
              </ThemedText>
            </TouchableOpacity>
          </>
        )}

        {isAprovada && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onReceberOrdem(ordem)}
            accessibilityRole="button"
            accessibilityLabel={`Dar entrada e receber mercadoria da ordem ${ordem.protocolo}`}
            style={styles.btnReceber}
          >
            <PackageCheck size={16} color={tokens.colors.white} />
            <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
              Dar Entrada / Receber Mercadoria
            </ThemedText>
          </TouchableOpacity>
        )}

        {isRecebida && (
          <View style={styles.recebidaInfo}>
            <PackageCheck size={16} color="#16A34A" />
            <ThemedText variant="caption" weight="bold" color="#16A34A">
              Mercadoria integrada ao estoque físico
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: tokens.spacing.sm,
    ...createShadow({ offsetY: 2, radius: 4, opacity: 0.08, elevation: 2 }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerInfo: { gap: 4, flex: 1 },
  protocoloRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  badgePendente: { backgroundColor: '#FEF3C7' },
  badgeAprovada: { backgroundColor: '#DBEAFE' },
  badgeRecebida: { backgroundColor: '#DCFCE7' },
  badgeCancelada: { backgroundColor: '#FEE2E2' },
  statusTexto: { fontSize: 11 },
  textoPendente: { color: '#B45309' },
  textoAprovada: { color: '#1D4ED8' },
  textoRecebida: { color: '#15803D' },
  textoCancelada: { color: '#B91C1C' },
  fornecedorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', padding: 6, borderRadius: 4 },
  observacaoTexto: { fontStyle: 'italic' },
  itensBox: { backgroundColor: '#F8FAFC', borderRadius: tokens.radii.sm, padding: tokens.spacing.sm, gap: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  acoesRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: tokens.spacing.sm, marginTop: tokens.spacing.xs, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: tokens.spacing.sm },
  btnCancelar: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: tokens.radii.sm, borderWidth: 1, borderColor: '#FCA5A5' },
  btnComprada: { backgroundColor: tokens.colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: tokens.radii.sm },
  btnReceber: { backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: tokens.radii.sm },
  recebidaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
});
