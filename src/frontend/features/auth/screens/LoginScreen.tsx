import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { AppDialog } from '@/shared/components/AppDialog';
import { useAuthStore } from '../hooks/useAuthStore';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { authService, TENANTS_PADRAO, OPERADORES_RECENTES_PADRAO } from '../services/authService';
import { AuthHeader } from '../components/AuthHeader';
import { TenantSelectorCard } from '../components/TenantSelectorCard';
import { TenantSelectorModal } from '../components/TenantSelectorModal';
import { CredentialsCard } from '../components/CredentialsCard';
import { RecentOperatorsGrid } from '../components/RecentOperatorsGrid';
import { LoginCtaSection } from '../components/LoginCtaSection';
import { ModalCadastroRestaurante } from '../components/ModalCadastroRestaurante';
import { RestauranteTenant, OperadorRecente } from '../types';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const currentTenant = useAuthStore((state) => state.tenant);
  const setTenant = useAuthStore((state) => state.setTenant);
  const loginMutation = useLoginMutation();

  const [identificador, setIdentificador] = useState('operador@restaurante.com');
  const [palavraPasse, setPalavraPasse] = useState('123456');
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
  const [tenants, setTenants] = useState<RestauranteTenant[]>(TENANTS_PADRAO);
  const [operadores] = useState<OperadorRecente[]>(OPERADORES_RECENTES_PADRAO);
  const [operadorAtivoId, setOperadorAtivoId] = useState<string>('99999999-9999-9999-9999-999999999999');

  useEffect(() => {
    authService.obterTenants().then(setTenants);
  }, []);

  const handleSelectOperador = (op: OperadorRecente) => {
    setOperadorAtivoId(op.id);
    setIdentificador(op.email);
    setPalavraPasse('123456');
  };

  const handleIniciarTurno = () => {
    if (!identificador.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe seu e-mail ou matrícula de operador.');
      return;
    }

    if (!palavraPasse.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe sua senha de acesso ou PIN de 6 dígitos.');
      return;
    }

    const tenantId = currentTenant?.id || tenants[0]?.id || '99999999-9999-9999-9999-999999999999';

    loginMutation.mutate(
      {
        identificador: identificador.trim(),
        palavraPasse: palavraPasse.trim(),
        restauranteId: tenantId,
      },
      {
        onError: (err) => {
          AppDialog.error('Falha na Autenticação', err.message || 'Credenciais inválidas.');
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
      >
        {/* Header com Branding e Status do Terminal */}
        <AuthHeader />

        {/* Card Seletor de Unidade Multi-Tenant */}
        <TenantSelectorCard
          tenant={currentTenant}
          onPressAlterar={() => setIsTenantModalOpen(true)}
        />

        {/* Inputs de Credenciais do Caixa */}
        <CredentialsCard
          identificador={identificador}
          onIdentificadorChange={setIdentificador}
          palavraPasse={palavraPasse}
          onPalavraPasseChange={setPalavraPasse}
        />

        {/* Operadores Recentes no Terminal */}
        <RecentOperatorsGrid
          operadores={operadores}
          operadorAtivoId={operadorAtivoId}
          onSelectOperador={handleSelectOperador}
        />

        {/* Botão de Ação CTA e Metadados */}
        <LoginCtaSection
          onIniciarTurno={handleIniciarTurno}
          isLoading={loginMutation.isPending}
          disabled={!identificador.trim() || !palavraPasse.trim()}
        />

        {/* CTA Onboarding de Novo Inquilino (14 Dias Grátis) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar novo restaurante com 14 dias grátis"
          onPress={() => setIsCadastroModalOpen(true)}
          style={({ pressed }) => [styles.bannerCadastro, pressed && styles.bannerCadastroPressionado]}
        >
          <ThemedText variant="subtitle" weight="bold" color={tokens.colors.primary}>
            ✨ Novo por aqui? Cadastre seu Restaurante
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtextoCadastro}>
            Ganhe 14 dias de degustação gratuita sem cartão
          </ThemedText>
        </Pressable>
      </ScrollView>

      {/* Modal de Troca de Tenant */}
      <TenantSelectorModal
        visible={isTenantModalOpen}
        tenants={tenants}
        tenantAtivoId={currentTenant?.id || ''}
        onSelectTenant={setTenant}
        onClose={() => setIsTenantModalOpen(false)}
      />

      {/* Modal de Auto-Cadastro de Inquilino (SaaS Onboarding) */}
      <ModalCadastroRestaurante
        visible={isCadastroModalOpen}
        onClose={() => setIsCadastroModalOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xl,
  },
  bannerCadastro: {
    marginTop: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.lg,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 4,
  },
  bannerCadastroPressionado: {
    opacity: 0.8,
  },
  subtextoCadastro: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
  },
});
