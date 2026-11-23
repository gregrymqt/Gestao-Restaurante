import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import {
  Store,
  ChefHat,
  ClipboardList,
  Boxes,
  Search,
  X,
  WifiOff,
  Plus,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { AbaEstoqueAtiva } from '../types';

interface EstoqueHeaderProps {
  totalInsumos: number;
  totalFichas: number;
  busca: string;
  onBuscaChange: (texto: string) => void;
  abaAtiva: AbaEstoqueAtiva;
  onNovoItem: () => void;
}

export function EstoqueHeader({
  totalInsumos,
  totalFichas,
  busca,
  onBuscaChange,
  abaAtiva,
  onNovoItem,
}: EstoqueHeaderProps) {
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);

  const textoInsumos = `${totalInsumos} ${totalInsumos === 1 ? 'Insumo Cadastrado' : 'Insumos Cadastrados'}`;
  const textoFichas = `${totalFichas} ${totalFichas === 1 ? 'Ficha (BOM)' : 'Fichas (BOM)'}`;

  return (
    <View style={styles.container}>
      {/* Top Branding & Status Row */}
      <View style={styles.topBrandingRow}>
        <View style={styles.brandGroup}>
          <View style={styles.storeLogoBox}>
            <Store size={20} color={tokens.colors.primary} />
          </View>
          <View>
            <ThemedText variant="body" style={styles.brandTitle}>
              Restaurante Inteligente{' '}
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                • Estoque
              </ThemedText>
            </ThemedText>
            <View style={styles.statusLive}>
              <View style={styles.statusDotLive} />
              <ThemedText variant="caption" style={styles.statusLiveText}>
                CAIXA ABERTO
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.avatarCircle}>
          <ChefHat size={18} color={tokens.colors.primary} />
        </View>
      </View>

      {/* Module Tag & Title */}
      <View style={styles.titleSection}>
        <ThemedText variant="caption" style={styles.moduleTag}>
          MÓDULO DE SUPRIMENTOS
        </ThemedText>

        <View style={styles.titleRow}>
          <ThemedText variant="title" style={styles.mainTitle}>
            Gestão de Inventário
          </ThemedText>

          <View style={styles.titleActions}>
            <View style={[styles.ledgerBadge, !isApiOnline && styles.ledgerBadgeOffline]}>
              {isApiOnline ? (
                <>
                  <View style={styles.ledgerDot} />
                  <ThemedText variant="caption" style={styles.ledgerText}>
                    Sincronizado
                  </ThemedText>
                </>
              ) : (
                <>
                  <WifiOff size={12} color="#D97706" style={styles.offlineIcon} />
                  <ThemedText variant="caption" style={styles.ledgerTextOffline}>
                    Offline (Somente Leitura)
                  </ThemedText>
                </>
              )}
            </View>

            {abaAtiva !== 'ordens' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNovoItem}
                style={styles.btnNovoHeader}
                accessibilityRole="button"
                accessibilityLabel={abaAtiva === 'insumos' ? 'Cadastrar novo insumo' : 'Cadastrar nova ficha técnica'}
              >
                <Plus size={14} color={tokens.colors.white} />
                <ThemedText variant="caption" style={styles.btnNovoHeaderText}>
                  {abaAtiva === 'insumos' ? '+ Insumo' : '+ Ficha'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Counters Chips com Pluralização Rigorosa */}
      <View style={styles.countersRow}>
        <View style={styles.counterChip}>
          <ClipboardList size={14} color={tokens.colors.primary} />
          <ThemedText variant="caption" style={styles.chipText}>
            {textoInsumos}
          </ThemedText>
        </View>

        <View style={styles.counterChip}>
          <Boxes size={14} color={tokens.colors.primary} />
          <ThemedText variant="caption" style={styles.chipText}>
            {textoFichas}
          </ThemedText>
        </View>
      </View>

      {/* Search Input Bar com Limpeza Rápida */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color={tokens.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar insumo, SKU ou código..."
          placeholderTextColor={tokens.colors.textMuted}
          value={busca}
          onChangeText={onBuscaChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {busca.trim().length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onBuscaChange('')}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
          >
            <X size={16} color={tokens.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: tokens.spacing.md, paddingTop: tokens.spacing.sm, paddingBottom: tokens.spacing.sm },
  topBrandingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.md },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  storeLogoBox: { width: 38, height: 38, borderRadius: tokens.radii.sm, backgroundColor: tokens.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontWeight: '800', color: tokens.colors.textPrimary },
  statusLive: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  statusDotLive: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.colors.status.greenText },
  statusLiveText: { fontSize: 10, fontWeight: '700', color: tokens.colors.status.greenText },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  titleSection: { marginBottom: tokens.spacing.sm },
  moduleTag: { color: '#C92A14', fontWeight: '800', fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainTitle: { fontSize: 20, fontWeight: '800', color: tokens.colors.textPrimary, flexShrink: 1 },
  btnNovoHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: tokens.radii.sm, gap: 4 },
  btnNovoHeaderText: { color: tokens.colors.white, fontWeight: '700', fontSize: 11 },
  ledgerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: tokens.radii.full, gap: 4 },
  ledgerBadgeOffline: { backgroundColor: '#FEF3C7' },
  ledgerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.colors.status.greenText },
  offlineIcon: { marginRight: 2 },
  ledgerText: { fontSize: 10, fontWeight: '700', color: tokens.colors.status.greenText },
  ledgerTextOffline: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  countersRow: { flexDirection: 'row', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm },
  counterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.colors.card, borderWidth: 1, borderColor: tokens.colors.border, paddingHorizontal: tokens.spacing.sm, paddingVertical: 6, borderRadius: tokens.radii.sm, gap: 6 },
  chipText: { fontWeight: '600', color: tokens.colors.textSecondary, fontSize: 11 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.colors.card, borderWidth: 1, borderColor: tokens.colors.border, borderRadius: tokens.radii.md, paddingHorizontal: tokens.spacing.sm, height: 44 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 44, fontSize: tokens.typography.fontSm, color: tokens.colors.textPrimary },
  clearButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
