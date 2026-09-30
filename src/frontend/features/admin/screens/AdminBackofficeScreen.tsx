import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useAdminTenants } from '../hooks/useAdminTenants';
import { CardTenantAdmin } from '../components/CardTenantAdmin';

interface AdminBackofficeScreenProps {
  onVoltar?: () => void;
}

export function AdminBackofficeScreen({ onVoltar }: AdminBackofficeScreenProps) {
  const [busca, setBusca] = useState('');
  const {
    tenants,
    isLoading,
    refetch,
    estenderTrial,
    isEstendendo,
    alterarStatus,
    isAlterando,
  } = useAdminTenants();

  const totalTenants = tenants.length;
  const totalTrials = tenants.filter((t) => t.statusAssinatura === 'TRIAL').length;
  const totalAtivos = tenants.filter((t) => t.statusAssinatura === 'ATIVA').length;

  const tenantsFiltrados = tenants.filter(
    (t) =>
      t.nomeRestaurante.toLowerCase().includes(busca.toLowerCase()) ||
      t.cnpj.includes(busca) ||
      t.gestorEmail.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header SuperAdmin */}
        <View style={styles.header}>
          <View style={styles.topoRow}>
            <View style={styles.tagAdmin}>
              <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
                🛡️ SUPERADMIN
              </ThemedText>
            </View>

            {onVoltar && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar painel SuperAdmin"
                onPress={onVoltar}
                style={styles.botaoFechar}
              >
                <ThemedText variant="subtitle" style={styles.fecharTexto}>
                  ✕
                </ThemedText>
              </Pressable>
            )}
          </View>

          <ThemedText variant="title" style={styles.titulo}>
            Backoffice SaaS da Plataforma
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtitulo}>
            Gerencie inquilinos, estenda testes e altere planos com cliques sem usar CLI.
          </ThemedText>

          {/* Cards de Métricas Agregadas */}
          <View style={styles.metricasRow}>
            <View style={styles.metricaBox}>
              <ThemedText variant="caption" style={styles.labelMetrica}>
                TOTAL INQUILINOS
              </ThemedText>
              <ThemedText variant="subtitle" weight="bold">
                {totalTenants} lojas
              </ThemedText>
            </View>

            <View style={styles.metricaBox}>
              <ThemedText variant="caption" style={styles.labelMetrica}>
                EM DEGUSTAÇÃO
              </ThemedText>
              <ThemedText variant="subtitle" weight="bold" color="#B25E00">
                {totalTrials} trials
              </ThemedText>
            </View>

            <View style={styles.metricaBox}>
              <ThemedText variant="caption" style={styles.labelMetrica}>
                ASSINATURAS ATIVAS
              </ThemedText>
              <ThemedText variant="subtitle" weight="bold" color={tokens.colors.status.greenText}>
                {totalAtivos} ativas
              </ThemedText>
            </View>
          </View>

          {/* Campo de Busca Rápida */}
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar por nome, CNPJ ou gestor..."
            placeholderTextColor={tokens.colors.textMuted}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Lista de Inquilinos */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[tokens.colors.primary]}
              tintColor={tokens.colors.primary}
            />
          }
        >
          {tenantsFiltrados.map((item) => (
            <CardTenantAdmin
              key={item.restauranteId}
              tenant={item}
              isProcessando={isEstendendo || isAlterando}
              onEstenderTrial={(id, dias) => estenderTrial({ restauranteId: id, dias })}
              onAlterarStatus={(id, status) =>
                alterarStatus({ restauranteId: id, novoStatus: status })
              }
            />
          ))}

          {tenantsFiltrados.length === 0 && (
            <View style={styles.vazioContainer}>
              <ThemedText style={styles.iconeVazio}>🔍</ThemedText>
              <ThemedText variant="subtitle" weight="bold">
                Nenhum restaurante localizado
              </ThemedText>
              <ThemedText variant="caption" style={styles.subtextoVazio}>
                Tente outros termos de busca para filtrar inquilinos.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E2C',
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    backgroundColor: '#1E1E2C',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.md,
  },
  topoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  tagAdmin: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  botaoFechar: {
    padding: tokens.spacing.xs,
  },
  fecharTexto: {
    color: tokens.colors.white,
    fontSize: 18,
  },
  titulo: {
    color: tokens.colors.white,
    fontSize: tokens.typography.fontLg,
  },
  subtitulo: {
    color: '#B0B0C0',
    marginTop: 2,
    marginBottom: tokens.spacing.md,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  metricaBox: {
    flex: 1,
    backgroundColor: '#2B2B3D',
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.sm,
    alignItems: 'center',
  },
  labelMetrica: {
    fontSize: 8,
    color: '#9090A6',
    marginBottom: 2,
  },
  inputBusca: {
    backgroundColor: '#2B2B3D',
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 8,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.white,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  vazioContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xxl,
    gap: tokens.spacing.xs,
  },
  iconeVazio: {
    fontSize: 32,
    marginBottom: tokens.spacing.xs,
  },
  subtextoVazio: {
    color: tokens.colors.textMuted,
  },
});
