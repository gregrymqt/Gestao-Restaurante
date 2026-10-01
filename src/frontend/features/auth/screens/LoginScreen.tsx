import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { AppDialog } from '@/shared/components/AppDialog';
import { shadows } from '@/shared/utils/shadows';
import { useAuthStore } from '../hooks/useAuthStore';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { authService, TENANTS_PADRAO, OPERADORES_RECENTES_PADRAO } from '../services/authService';
import { AuthHeader } from '../components/AuthHeader';
import { TenantSelectorCard } from '../components/TenantSelectorCard';
import { TenantSelectorModal } from '../components/TenantSelectorModal';
import { CredentialsCard } from '../components/CredentialsCard';
import { RecentOperatorsGrid } from '../components/RecentOperatorsGrid';
import { OperadorModeToggle } from '../components/OperadorModeToggle';
import { LoginCtaSection } from '../components/LoginCtaSection';
import { ModalCadastroRestaurante } from '../components/ModalCadastroRestaurante';
import { RestauranteTenant, OperadorRecente } from '../types';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const currentTenant = useAuthStore((state) => state.tenant);
  const setTenant = useAuthStore((state) => state.setTenant);
  const loginMutation = useLoginMutation();

  const [identificador, setIdentificador] = useState('gestor@restaurante.com');
  const [palavraPasse, setPalavraPasse] = useState('123456');
  const [isOperadorMode, setIsOperadorMode] = useState(false);
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

  const handleToggleOperadorMode = () => {
    setIsOperadorMode((prev) => {
      const next = !prev;
      if (next) {
        setIdentificador('operador@restaurante.com');
      } else {
        setIdentificador('gestor@restaurante.com');
      }
      return next;
    });
  };

  const handleAcessarPainel = () => {
    if (!identificador.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe seu e-mail de acesso.');
      return;
    }

    if (!palavraPasse.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe sua senha de acesso.');
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
        {/* Header com Branding Oficial e Status do Sistema */}
        <AuthHeader />

        {/* Card Seletor de Unidade / Filial */}
        <TenantSelectorCard
          tenant={currentTenant}
          onPressAlterar={() => setIsTenantModalOpen(true)}
        />

        {/* Inputs de Credenciais do Gestor / Operador */}
        <CredentialsCard
          identificador={identificador}
          onIdentificadorChange={setIdentificador}
          palavraPasse={palavraPasse}
          onPalavraPasseChange={setPalavraPasse}
        />

        {/* Alternador Discreto de Modo Caixa / Operador */}
        <OperadorModeToggle
          isOperadorMode={isOperadorMode}
          onToggle={handleToggleOperadorMode}
        />

        {/* Operadores Recentes (Visíveis apenas quando em Modo Operador) */}
        {isOperadorMode && (
          <RecentOperatorsGrid
            operadores={operadores}
            operadorAtivoId={operadorAtivoId}
            onSelectOperador={handleSelectOperador}
          />
        )}

        {/* Botão Primário CTA: Acessar Painel */}
        <LoginCtaSection
          onIniciarTurno={handleAcessarPainel}
          isLoading={loginMutation.isPending}
          disabled={!identificador.trim() || !palavraPasse.trim()}
        />

        {/* Card Onboarding SaaS de Novo Inquilino (14 Dias Grátis) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar novo restaurante com 14 dias grátis"
          onPress={() => setIsCadastroModalOpen(true)}
          style={({ pressed }) => [styles.bannerCadastro, pressed && styles.bannerCadastroPressionado]}
        >
          <View style={styles.bannerIconBox}>
            <Ionicons name="sparkles" size={20} color={tokens.colors.primary} />
          </View>
          <View style={styles.bannerTextBox}>
            <ThemedText variant="subtitle" weight="bold" color={tokens.colors.primaryDark}>
              Novo no Restaurante Inteligente?
            </ThemedText>
            <ThemedText variant="caption" style={styles.subtextoCadastro}>
              Comece seu teste de 14 dias totalmente grátis
            </ThemedText>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={tokens.colors.primary} />
        </Pressable>
      </ScrollView>

      {/* Modal de Troca de Unidade / Filial com FlashList e Busca */}
      <TenantSelectorModal
        visible={isTenantModalOpen}
        tenants={tenants}
        tenantAtivoId={currentTenant?.id || ''}
        onSelectTenant={setTenant}
        onClose={() => setIsTenantModalOpen(false)}
      />

      {/* Modal de Auto-Cadastro de Inquilino com Compensação de Teclado */}
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
    paddingBottom: tokens.spacing.xxl,
  },
  bannerCadastro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
    marginHorizontal: tokens.spacing.lg,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...shadows.sm,
    gap: tokens.spacing.md,
  },
  bannerCadastroPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextBox: {
    flex: 1,
  },
  subtextoCadastro: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
    marginTop: 2,
  },
});
