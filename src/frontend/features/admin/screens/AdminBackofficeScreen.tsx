import React, { useState } from 'react';
import {
  View,
  TextInput,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { useAdminTenants } from '../hooks/useAdminTenants';
import { CardTenantAdmin } from '../components/CardTenantAdmin';
import { ModalEstenderTrial } from '../components/ModalEstenderTrial';
import { ModalConfirmarSuspensao } from '../components/ModalConfirmarSuspensao';
import { EmptyStateTenants } from '../components/EmptyStateTenants';
import { TenantAdminItem, FiltroStatusTenant } from '../types';
import { styles } from './AdminBackofficeScreen.styles';

interface AdminBackofficeScreenProps {
  onVoltar?: () => void;
}

const CHIPS_STATUS: { id: FiltroStatusTenant; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'TRIAL', label: 'Trials' },
  { id: 'ATIVA', label: 'Ativas' },
  { id: 'EXPIRADA', label: 'Expiradas' },
];

export function AdminBackofficeScreen({ onVoltar }: AdminBackofficeScreenProps) {
  const {
    tenants,
    totalItens,
    busca,
    setBusca,
    statusFiltro,
    setStatusFiltro,
    limparFiltros,
    isLoading,
    refetch,
    estenderTrial,
    isEstendendo,
    alterarStatus,
    isAlterando,
  } = useAdminTenants();

  const [tenantParaTrial, setTenantParaTrial] = useState<TenantAdminItem | null>(null);
  const [tenantParaSuspender, setTenantParaSuspender] = useState<TenantAdminItem | null>(null);

  const totalTrials = tenants.filter((t) => t.statusAssinatura === 'TRIAL').length;
  const totalAtivos = tenants.filter((t) => t.statusAssinatura === 'ATIVA').length;

  const handleConfirmarTrial = (restauranteId: string, dias: number) => {
    estenderTrial(
      { restauranteId, dias },
      {
        onSettled: () => setTenantParaTrial(null),
      }
    );
  };

  const handleConfirmarSuspensao = (restauranteId: string) => {
    alterarStatus(
      { restauranteId, novoStatus: 'EXPIRADA' },
      {
        onSettled: () => setTenantParaSuspender(null),
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Topo / Header SuperAdmin */}
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
            Gestão visual de inquilinos, vigência de trials e ativação de licenças.
          </ThemedText>

          {/* Chips Rápidos de Filtragem por Status */}
          <View style={styles.chipsRow}>
            {CHIPS_STATUS.map((chip) => {
              const isAtivo = statusFiltro === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar por ${chip.label}`}
                  onPress={() => setStatusFiltro(chip.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    isAtivo && styles.chipAtivo,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    weight="bold"
                    color={isAtivo ? tokens.colors.white : '#B0B0C0'}
                  >
                    {chip.label}
                    {chip.id === 'TODOS' ? ` (${totalItens})` : ''}
                    {chip.id === 'TRIAL' ? ` (${totalTrials})` : ''}
                    {chip.id === 'ATIVA' ? ` (${totalAtivos})` : ''}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Campo de Busca Rápida com Debounce */}
          <View style={styles.buscaContainer}>
            <TextInput
              style={styles.inputBusca}
              placeholder="Buscar por loja, CNPJ ou gestor..."
              placeholderTextColor={tokens.colors.textMuted}
              value={busca}
              onChangeText={setBusca}
            />
            {busca.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                onPress={() => setBusca('')}
                style={styles.botaoLimparBusca}
              >
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  ✕
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Lista Virtualizada FlashList de Alta Performance */}
        <View style={styles.listWrapper}>
          <FlashList
            data={tenants}
            keyExtractor={(item) => item.restauranteId}
            contentContainerStyle={styles.flashListContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => { void refetch(); }}
                colors={[tokens.colors.primary]}
                tintColor={tokens.colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyStateTenants
                busca={busca}
                statusFiltro={statusFiltro}
                onLimparFiltros={limparFiltros}
              />
            }
            renderItem={({ item }) => (
              <CardTenantAdmin
                tenant={item}
                isProcessando={isEstendendo || isAlterando}
                onAbrirModalTrial={(t) => setTenantParaTrial(t)}
                onAbrirModalSuspender={(t) => setTenantParaSuspender(t)}
                onAtivarPlanoPro={(id) =>
                  alterarStatus({ restauranteId: id, novoStatus: 'ATIVA' })
                }
              />
            )}
          />
        </View>

        {/* Modais de Ação e Confirmação */}
        <ModalEstenderTrial
          visible={tenantParaTrial !== null}
          tenant={tenantParaTrial}
          isSubmitting={isEstendendo}
          onClose={() => setTenantParaTrial(null)}
          onConfirmar={handleConfirmarTrial}
        />

        <ModalConfirmarSuspensao
          visible={tenantParaSuspender !== null}
          tenant={tenantParaSuspender}
          isSubmitting={isAlterando}
          onClose={() => setTenantParaSuspender(null)}
          onConfirmar={handleConfirmarSuspensao}
        />
      </View>
    </SafeAreaView>
  );
}
