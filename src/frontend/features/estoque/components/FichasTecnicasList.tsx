import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Beef,
  CupSoda,
  CakeSlice,
  UtensilsCrossed,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { FichaTecnicaItem } from '../types';
import { FichaTecnicaIngredientesPills } from './FichaTecnicaIngredientesPills';
import { FichaTecnicaFinanceGrid } from './FichaTecnicaFinanceGrid';

interface FichasTecnicasListProps {
  fichas: FichaTecnicaItem[];
  onEditarFicha?: (ficha: FichaTecnicaItem) => void;
}

function getIconeFicha(nomeProduto: string, categoria?: string) {
  const texto = `${nomeProduto} ${categoria || ''}`.toLowerCase();
  if (
    texto.includes('burger') ||
    texto.includes('hambúrguer') ||
    texto.includes('hamburguer') ||
    texto.includes('angus') ||
    texto.includes('carne') ||
    texto.includes('bacon')
  ) {
    return <Beef size={22} color={tokens.colors.primary} />;
  }
  if (
    texto.includes('suco') ||
    texto.includes('refrigerante') ||
    texto.includes('bebida') ||
    texto.includes('lata')
  ) {
    return <CupSoda size={22} color={tokens.colors.primary} />;
  }
  if (
    texto.includes('brownie') ||
    texto.includes('pudim') ||
    texto.includes('sobremesa') ||
    texto.includes('doce') ||
    texto.includes('torta') ||
    texto.includes('bolo')
  ) {
    return <CakeSlice size={22} color={tokens.colors.primary} />;
  }
  return <UtensilsCrossed size={22} color={tokens.colors.primary} />;
}

export function FichasTecnicasList({ fichas, onEditarFicha }: FichasTecnicasListProps) {
  if (fichas.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Search size={32} color={tokens.colors.textMuted} style={styles.emptyIcon} />
        <ThemedText variant="body" style={styles.emptyTitle}>
          Nenhuma ficha técnica encontrada
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Verifique o termo buscado ou adicione novos produtos com BOM.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.title}>
          Receitas &amp; Fichas Técnicas (BOM)
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          {fichas.length} fórmulas ativas com apuração de custos em tempo real
        </ThemedText>
      </View>

      <View style={styles.list}>
        {fichas.map((ficha) => (
          <View key={ficha.id} style={styles.card}>
            <View style={styles.topInfoRow}>
              <View style={styles.thumbnailBox}>
                {getIconeFicha(ficha.nomeProduto, ficha.categoria)}
              </View>

              <View style={styles.headerDetails}>
                <View style={styles.skuBadgeRow}>
                  <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.skuText}>
                    SKU {ficha.sku}
                  </ThemedText>
                  <View style={styles.bomBadge}>
                    <ThemedText variant="caption" style={styles.bomBadgeText}>
                      {ficha.versaoBom || 'v1.0 (Ativa)'}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText variant="body" style={styles.nomeProduto}>
                  {ficha.nomeProduto}
                </ThemedText>

                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  Preparo: {ficha.tempoPreparoMin || 10} min
                </ThemedText>
              </View>

              {/* Botão de Edição de Ficha Técnica (Área de Toque 44x44px) */}
              {onEditarFicha && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onEditarFicha(ficha)}
                  style={styles.btnEditarFicha}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ficha técnica de ${ficha.nomeProduto}`}
                >
                  <Pencil size={18} color={tokens.colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Ingredientes / BOM Pills Modular */}
            <FichaTecnicaIngredientesPills
              ingredientes={ficha.ingredientes}
              tituloSecao="INGREDIENTES DA FORMULAÇÃO"
              exibirQuantidade
            />

            {/* Grid Financeiro Modular */}
            <FichaTecnicaFinanceGrid
              custoInsumos={ficha.custoInsumos}
              precoBalcao={ficha.precoBalcao}
              margemBrutaPercentual={ficha.margemBrutaPercentual}
            />

            {/* Capacidade no Turno */}
            <View
              style={[
                styles.capacidadeBox,
                ficha.insumoLimitanteNome ? styles.capacidadeAlerta : styles.capacidadeOk,
              ]}
            >
              {ficha.insumoLimitanteNome ? (
                <AlertTriangle size={15} color={tokens.colors.status.orangeText} style={styles.capacidadeIcon} />
              ) : (
                <CheckCircle2 size={15} color={tokens.colors.status.greenText} style={styles.capacidadeIcon} />
              )}
              <ThemedText
                variant="caption"
                style={ficha.insumoLimitanteNome ? styles.capacidadeTextoAlerta : styles.capacidadeTextoOk}
              >
                Capacidade Máxima: {ficha.capacidadeTurnoPorcoes} porções{' '}
                {ficha.insumoLimitanteNome ? `(limitado por ${ficha.insumoLimitanteNome})` : '(100% abastecido)'}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  header: {
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  emptyContainer: {
    padding: tokens.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: tokens.spacing.sm,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  list: {
    gap: tokens.spacing.md,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    ...shadows.sm,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  thumbnailBox: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.md,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDetails: {
    flex: 1,
  },
  skuBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  skuText: {
    fontWeight: '700',
    fontSize: 10,
  },
  bomBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  nomeProduto: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontMd,
  },
  btnEditarFicha: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primaryLight,
  },
  capacidadeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    marginTop: tokens.spacing.xs,
  },
  capacidadeAlerta: {
    backgroundColor: '#FEF3C7',
  },
  capacidadeOk: {
    backgroundColor: '#ECFDF5',
  },
  capacidadeIcon: {
    marginRight: 6,
  },
  capacidadeTextoAlerta: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 11,
    flex: 1,
  },
  capacidadeTextoOk: {
    color: tokens.colors.status.greenText,
    fontWeight: '700',
    fontSize: 11,
    flex: 1,
  },
});
