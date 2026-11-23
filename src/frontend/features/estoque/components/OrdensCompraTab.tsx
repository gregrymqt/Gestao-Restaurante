import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { OrdemCompraDetalhe } from '@/features/previsoes/types';
import { FiltroStatusOrdem } from '@/features/previsoes/hooks/useOrdensCompra';
import { OrdemCompraCard } from './OrdemCompraCard';

interface OrdensCompraTabProps {
  ordens: OrdemCompraDetalhe[];
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => Promise<unknown>;
  filtroStatus: FiltroStatusOrdem;
  setFiltroStatus: (filtro: FiltroStatusOrdem) => void;
  contadores: { todas: number; pendentes: number; aprovadas: number; recebidas: number };
  onMarcarComprada: (ordem: OrdemCompraDetalhe) => void;
  onReceberOrdem: (ordem: OrdemCompraDetalhe) => void;
  onCancelarOrdem: (ordem: OrdemCompraDetalhe) => void;
}

export function OrdensCompraTab({
  ordens,
  isLoading,
  filtroStatus,
  setFiltroStatus,
  contadores,
  onMarcarComprada,
  onReceberOrdem,
  onCancelarOrdem,
}: OrdensCompraTabProps) {
  const filtros: Array<{ id: FiltroStatusOrdem; label: string; count: number }> = [
    { id: 'TODAS', label: 'Todas', count: contadores.todas },
    { id: 'PENDENTE', label: 'Pendentes', count: contadores.pendentes },
    { id: 'APROVADA', label: 'Compradas', count: contadores.aprovadas },
    { id: 'RECEBIDA', label: 'Recebidas', count: contadores.recebidas },
  ];

  return (
    <View style={styles.container}>
      {/* Pílulas de Filtro Rápido */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosRow}
      >
        {filtros.map((f) => {
          const ativo = filtroStatus === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.8}
              onPress={() => setFiltroStatus(f.id)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar ordens ${f.label}`}
              accessibilityState={{ selected: ativo }}
              style={[styles.filtroPilula, ativo && styles.filtroPilulaAtiva]}
            >
              <ThemedText
                variant="caption"
                weight={ativo ? 'bold' : 'normal'}
                style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}
              >
                {f.label} ({f.count})
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Conteúdo da Lista */}
      {isLoading && ordens.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.centerText}>
            Carregando ordens de compra...
          </ThemedText>
        </View>
      ) : ordens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ClipboardList size={40} color={tokens.colors.textMuted} />
          <ThemedText variant="subtitle" weight="bold" color={tokens.colors.textPrimary}>
            Nenhuma ordem encontrada
          </ThemedText>
          <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.emptySubtext}>
            {filtroStatus === 'TODAS'
              ? 'Não há ordens de compra emitidas para este restaurante.'
              : `Não há ordens com o status selecionado (${filtroStatus}).`}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.lista}>
          {ordens.map((ordem) => (
            <OrdemCompraCard
              key={ordem.id}
              ordem={ordem}
              onMarcarComprada={onMarcarComprada}
              onReceberOrdem={onReceberOrdem}
              onCancelarOrdem={onCancelarOrdem}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: tokens.spacing.md, gap: tokens.spacing.md },
  filtrosRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filtroPilula: {
    backgroundColor: '#F1F3F4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: tokens.radii.full,
  },
  filtroPilulaAtiva: { backgroundColor: tokens.colors.primary },
  filtroTexto: { color: tokens.colors.textSecondary },
  filtroTextoAtivo: { color: tokens.colors.white },
  centerContainer: { padding: tokens.spacing.xl, alignItems: 'center', gap: 8 },
  centerText: { marginTop: 8 },
  emptyContainer: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: tokens.radii.md,
    marginTop: tokens.spacing.sm,
  },
  emptySubtext: { textAlign: 'center' },
  lista: { gap: tokens.spacing.md, marginBottom: tokens.spacing.xl },
});
