import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { PedidoKds, StatusPreparoKds } from '../types';
import {
  calcularSlaTicket,
  obterEstiloModificadorKds,
  obterProximaAcaoKds,
} from '../utils/kdsHelpers';

interface TicketKdsCardProps {
  pedido: PedidoKds;
  agoraMs: number;
  isProcessando: boolean;
  onAvancarStatus: (vendaId: string, proximoStatus: StatusPreparoKds) => void;
}

export function TicketKdsCard({
  pedido,
  agoraMs,
  isProcessando,
  onAvancarStatus,
}: TicketKdsCardProps) {
  const sla = calcularSlaTicket(pedido.dataHora, agoraMs);
  const proximaAcao = obterProximaAcaoKds(pedido.statusPreparo);
  const horaEntrada = new Date(pedido.dataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.card, { borderColor: sla.corBorda }]}>
      {/* Cabeçalho Colorido por SLA */}
      <View style={[styles.header, { backgroundColor: sla.corFundo, borderBottomColor: sla.corBorda }]}>
        <View style={styles.headerLeft}>
          <ThemedText variant="subtitle" weight="bold" style={[styles.codigo, { color: sla.corTexto }]}>
            {pedido.codigoCurto}
          </ThemedText>
          <ThemedText variant="caption" style={[styles.hora, { color: sla.corTexto }]}>
            {horaEntrada}
          </ThemedText>
          {sla.atrasado && (
            <View style={styles.badgeAtraso}>
              <ThemedText variant="caption" weight="bold" style={styles.badgeAtrasoText}>
                ATRASO
              </ThemedText>
            </View>
          )}
        </View>

        <View style={[styles.timerPill, { borderColor: sla.corBorda }]}>
          <ThemedText variant="caption" weight="bold" style={[styles.timerText, { color: sla.corTexto }]}>
            ⏱ {sla.formatado}
          </ThemedText>
        </View>
      </View>

      {/* Lista de Pratos e Modificadores Culinários */}
      <View style={styles.body}>
        {pedido.itens.map((item) => {
          const qtd = Number(item.quantidade || 1);
          const qtdFormatada = Number.isInteger(qtd) ? `${qtd}x` : `${qtd.toFixed(1)}x`;

          return (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <View style={styles.qtdBadge}>
                  <ThemedText variant="body" weight="bold" style={styles.qtdText}>
                    {qtdFormatada}
                  </ThemedText>
                </View>
                <ThemedText variant="body" weight="bold" style={styles.itemNome}>
                  {item.nomeProduto}
                </ThemedText>
              </View>

              {item.modificadores.length > 0 && (
                <View style={styles.tagsWrap}>
                  {item.modificadores.map((mod, idx) => {
                    const estilo = obterEstiloModificadorKds(mod.tipoAcao);
                    return (
                      <View
                        key={`${item.id}-mod-${idx}`}
                        style={[
                          styles.tagModificador,
                          { backgroundColor: estilo.bg, borderColor: estilo.border },
                        ]}
                      >
                        <ThemedText variant="caption" weight="bold" style={[styles.tagTexto, { color: estilo.text }]}>
                          {estilo.icone}
                          {mod.nome}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Ação Tátil de Avanço na Cozinha */}
      {proximaAcao && (
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${proximaAcao.label} para pedido ${pedido.codigoCurto}`}
            disabled={isProcessando}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onAvancarStatus(pedido.vendaId, proximaAcao.proximoStatus)}
            style={({ pressed }) => [
              styles.btnAcao,
              { backgroundColor: proximaAcao.cor },
              pressed && styles.btnPressed,
              isProcessando && styles.btnDisabled,
            ]}
          >
            {isProcessando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText variant="body" weight="bold" style={styles.btnAcaoTexto}>
                {proximaAcao.label}
              </ThemedText>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 2,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm + 2,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs + 2,
  },
  codigo: {
    fontSize: 17,
  },
  hora: {
    fontSize: 12,
    opacity: 0.85,
  },
  badgeAtraso: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAtrasoText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  timerPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 13,
  },
  body: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm + 2,
  },
  itemRow: {
    gap: tokens.spacing.xs + 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  qtdBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
  },
  qtdText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  itemNome: {
    flex: 1,
    fontSize: 15,
    color: tokens.colors.textPrimary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 38,
  },
  tagModificador: {
    borderWidth: 1,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagTexto: {
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
  },
  btnAcao: {
    minHeight: 48,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  btnAcaoTexto: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
