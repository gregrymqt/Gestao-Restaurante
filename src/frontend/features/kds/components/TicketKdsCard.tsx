import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { PedidoKds, StatusPreparoKds } from '../types';
import { useKdsChecklist } from '../hooks/useKdsChecklist';
import {
  calcularSlaTicket,
  obterEstiloModificadorKds,
  obterProximaAcaoKds,
  obterCoresHeaderKds,
  sanitizarNomeModificador,
  TipoIconeModificador,
} from '../utils/kdsHelpers';

interface TicketKdsCardProps {
  pedido: PedidoKds;
  agoraMs: number;
  isProcessando: boolean;
  onAvancarStatus: (vendaId: string, proximoStatus: StatusPreparoKds) => void;
}

const ICONE_MOD: Record<TipoIconeModificador, keyof typeof Ionicons.glyphMap> = {
  X: 'close',
  Flame: 'flame',
  Plus: 'add',
  Dot: 'remove',
};

const ICONE_ACAO: Record<string, keyof typeof Ionicons.glyphMap> = {
  RECEBIDO: 'flame',
  EM_PREPARO: 'checkmark-circle',
  PRONTO: 'checkmark-done',
};

export function TicketKdsCard({
  pedido,
  agoraMs,
  isProcessando,
  onAvancarStatus,
}: TicketKdsCardProps) {
  const { isItemMarcado, toggleItem, limparItens } = useKdsChecklist();

  const sla = calcularSlaTicket(pedido.dataHora, agoraMs);
  const proximaAcao = obterProximaAcaoKds(pedido.statusPreparo);
  const isPronto = pedido.statusPreparo === 'PRONTO';
  const corHeader = obterCoresHeaderKds(pedido.statusPreparo, sla);

  const horaEntrada = new Date(pedido.dataHora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const origemLabel = pedido.origem ?? 'Balcão';
  const origemCor = origemLabel === 'Balcão' ? '#6366F1' : '#0891B2';

  return (
    <View style={[styles.card, { borderColor: corHeader.corBorda }]}>
      {/* Cabeçalho Semântico por Status e SLA */}
      <View style={[styles.header, { backgroundColor: corHeader.corFundo, borderBottomColor: corHeader.corBorda }]}>
        <View style={styles.headerLeft}>
          <ThemedText variant="subtitle" weight="bold" style={[styles.codigo, { color: corHeader.corTexto }]}>
            {pedido.codigoCurto}
          </ThemedText>
          <ThemedText variant="caption" style={[styles.hora, { color: corHeader.corTexto }]}>
            {horaEntrada}
          </ThemedText>

          <View style={[styles.badgeOrigem, { backgroundColor: `${origemCor}18`, borderColor: origemCor }]}>
            <ThemedText variant="caption" weight="bold" style={[styles.badgeOrigemText, { color: origemCor }]}>
              {origemLabel}
            </ThemedText>
          </View>

          {sla.atrasado && !isPronto && (
            <View style={[styles.badgeAlerta, styles.badgeAtraso]}>
              <ThemedText variant="caption" weight="bold" style={styles.badgeAlertaText}>
                ATRASO
              </ThemedText>
            </View>
          )}

          {isPronto && (
            <View style={[styles.badgeAlerta, styles.badgePronto]}>
              <ThemedText variant="caption" weight="bold" style={styles.badgeAlertaText}>
                Aguard. Retirada
              </ThemedText>
            </View>
          )}
        </View>

        <View style={[styles.timerPill, { borderColor: corHeader.corBorda }]}>
          <ThemedText variant="caption" weight="bold" style={[styles.timerText, { color: corHeader.corTexto }]}>
            {sla.formatado}
          </ThemedText>
        </View>
      </View>

      {/* Lista de Pratos com Affordance de Checklist */}
      <View style={styles.body}>
        {pedido.itens.map((item) => {
          const qtd = Number(item.quantidade || 1);
          const qtdFormatada = Number.isInteger(qtd) ? `${qtd}x` : `${qtd.toFixed(1)}x`;
          const isMarcado = isItemMarcado(item.id);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isMarcado }}
              accessibilityLabel={`${item.nomeProduto}, toque para alternar checklist`}
              onPress={() => toggleItem(item.id)}
              style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
            >
              <View style={styles.itemHeader}>
                {/* Indicador visual explícito de checklist (18x18) */}
                <View style={[styles.checkboxBox, isMarcado ? styles.checkboxMarcado : styles.checkboxDesmarcado]}>
                  {isMarcado && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>

                <View style={[styles.qtdBadge, isMarcado && styles.qtdBadgeMarcado]}>
                  <ThemedText variant="body" weight="bold" style={styles.qtdText}>
                    {qtdFormatada}
                  </ThemedText>
                </View>

                <ThemedText
                  variant="body"
                  weight="bold"
                  style={[styles.itemNome, isMarcado && styles.itemRiscado]}
                >
                  {item.nomeProduto}
                </ThemedText>
              </View>

              {item.modificadores.length > 0 && (
                <View style={styles.tagsWrap}>
                  {item.modificadores.map((mod, idx) => {
                    const estilo = obterEstiloModificadorKds(mod.tipoAcao);
                    const nomeFormatado = sanitizarNomeModificador(mod.nome);

                    return (
                      <View
                        key={`${item.id}-mod-${idx}`}
                        style={[styles.tagModificador, { backgroundColor: estilo.bg, borderColor: estilo.border }]}
                      >
                        <Ionicons name={ICONE_MOD[estilo.icone] || 'remove'} size={11} color={estilo.text} />
                        <ThemedText variant="caption" weight="bold" style={[styles.tagTexto, { color: estilo.text }]}>
                          {nomeFormatado}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </Pressable>
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
            onPress={() => {
              limparItens(pedido.itens.map((i) => i.id));
              onAvancarStatus(pedido.vendaId, proximaAcao.proximoStatus);
            }}
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
              <View style={styles.btnAcaoInner}>
                <Ionicons
                  name={ICONE_ACAO[pedido.statusPreparo] || 'checkmark'}
                  size={pedido.statusPreparo === 'PRONTO' ? 18 : 16}
                  color="#FFFFFF"
                />
                <ThemedText variant="body" weight="bold" style={styles.btnAcaoTexto}>
                  {proximaAcao.label}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.colors.card, borderRadius: tokens.radii.lg, borderWidth: 2, marginBottom: tokens.spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm + 2, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacing.xs + 2 },
  codigo: { fontSize: 17 },
  hora: { fontSize: 12, opacity: 0.85 },
  badgeOrigem: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeOrigemText: { fontSize: 10 },
  badgeAlerta: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeAtraso: { backgroundColor: '#B91C1C' },
  badgePronto: { backgroundColor: '#15803D' },
  badgeAlertaText: { color: '#FFFFFF', fontSize: 10 },
  timerPill: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  timerText: { fontSize: 13 },
  body: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  itemRow: { minHeight: 44, justifyContent: 'center', gap: tokens.spacing.xs, paddingVertical: 4 },
  itemRowPressed: { opacity: 0.7 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkboxBox: { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxDesmarcado: { borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  checkboxMarcado: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  qtdBadge: { backgroundColor: '#1F2937', paddingHorizontal: 8, paddingVertical: 3, borderRadius: tokens.radii.sm },
  qtdBadgeMarcado: { backgroundColor: '#9CA3AF' },
  qtdText: { color: '#FFFFFF', fontSize: 14 },
  itemNome: { flex: 1, fontSize: 15, color: tokens.colors.textPrimary },
  itemRiscado: { textDecorationLine: 'line-through', opacity: 0.5 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 26 },
  tagModificador: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: tokens.radii.sm, paddingHorizontal: 8, paddingVertical: 4 },
  tagTexto: { fontSize: 12 },
  footer: { paddingHorizontal: tokens.spacing.md, paddingBottom: tokens.spacing.md },
  btnAcao: { minHeight: 48, borderRadius: tokens.radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.md },
  btnAcaoInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnAcaoTexto: { color: '#FFFFFF', fontSize: 15 },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
});
