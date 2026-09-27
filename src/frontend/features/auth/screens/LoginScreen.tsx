import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { useAuthStore } from '../hooks/useAuthStore';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { authService, TENANTS_PADRAO, OPERADORES_RECENTES_PADRAO } from '../services/authService';
import { AuthHeader } from '../components/AuthHeader';
import { TenantSelectorCard } from '../components/TenantSelectorCard';
import { TenantSelectorModal } from '../components/TenantSelectorModal';
import { CredentialsCard } from '../components/CredentialsCard';
import { RecentOperatorsGrid } from '../components/RecentOperatorsGrid';
import { LoginCtaSection } from '../components/LoginCtaSection';
import { RestauranteTenant, OperadorRecente } from '../types';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const currentTenant = useAuthStore((state) => state.tenant);
  const setTenant = useAuthStore((state) => state.setTenant);
  const loginMutation = useLoginMutation();

  const [identificador, setIdentificador] = useState('operador@gastropdv.com.br');
  const [palavraPasse, setPalavraPasse] = useState('123456');
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenants, setTenants] = useState<RestauranteTenant[]>(TENANTS_PADRAO);
  const [operadores] = useState<OperadorRecente[]>(OPERADORES_RECENTES_PADRAO);
  const [operadorAtivoId, setOperadorAtivoId] = useState<string>('op-lucas-vicente');

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
      Alert.alert('Campo Obrigatório', 'Informe seu e-mail ou matrícula de operador.');
      return;
    }

    if (!palavraPasse.trim()) {
      Alert.alert('Campo Obrigatório', 'Informe sua senha de acesso ou PIN de 6 dígitos.');
      return;
    }

    const tenantId = currentTenant?.id || tenants[0]?.id;

    loginMutation.mutate(
      {
        identificador: identificador.trim(),
        palavraPasse: palavraPasse.trim(),
        restauranteId: tenantId,
      },
      {
        onError: (err) => {
          Alert.alert('Falha na Autenticação', err.message || 'Credenciais inválidas.');
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
      </ScrollView>

      {/* Modal de Troca de Tenant */}
      <TenantSelectorModal
        visible={isTenantModalOpen}
        tenants={tenants}
        tenantAtivoId={currentTenant?.id || ''}
        onSelectTenant={setTenant}
        onClose={() => setIsTenantModalOpen(false)}
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
});
