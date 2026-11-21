import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { authService } from '../services/authService';
import { styles } from './EsqueciSenhaScreen.styles';

export function EsqueciSenhaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isApiOnline = useConnectionStore((state) => state.isApiOnline);
  const isOffline = !isApiOnline;

  const [etapa, setEtapa] = useState<'EMAIL' | 'REDEFINIR'>('EMAIL');
  const [email, setEmail] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolicitarCodigo = async () => {
    if (isOffline) {
      AppDialog.warning('Sem Conexão', 'A recuperação de senha via OTP requer conexão com a internet.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      AppDialog.warning('E-mail Inválido', 'Informe um e-mail corporativo válido.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await authService.solicitarRecuperacaoSenha(email);
      AppDialog.success('Código Gerado', res.message || 'Código enviado com sucesso!');
      setEtapa('REDEFINIR');
    } catch (err: unknown) {
      AppDialog.error('Erro na Solicitação', err instanceof Error ? err.message : 'Não foi possível gerar o código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedefinirSenha = async () => {
    if (isOffline) {
      AppDialog.warning('Sem Conexão', 'A redefinição de senha requer conexão com a internet.');
      return;
    }
    if (codigoOtp.trim().length !== 6) {
      AppDialog.warning('Código Incompleto', 'Digite o código de 6 dígitos recebido.');
      return;
    }
    if (novaSenha.length < 6) {
      AppDialog.warning('Senha Curta', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      AppDialog.warning('Senhas Divergentes', 'A confirmação de senha não confere com a nova senha.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await authService.redefinirSenha(email, codigoOtp, novaSenha);
      AppDialog.success('Sucesso!', res.message || 'Senha redefinida com sucesso.');
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      AppDialog.error('Falha na Redefinição', err instanceof Error ? err.message : 'Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const isBotaoDesabilitado = isLoading || (etapa === 'EMAIL' && isOffline);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'web' && {
            paddingTop: Math.max(24, insets.top + tokens.spacing.md),
            paddingBottom: Math.max(24, insets.bottom + 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => (etapa === 'REDEFINIR' ? setEtapa('EMAIL') : router.back())}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={tokens.colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={32} color={tokens.colors.primary} />
          </View>
          <ThemedText variant="title" weight="bold" style={styles.title}>
            {etapa === 'EMAIL' ? 'Recuperação de Senha' : 'Criar Nova Senha'}
          </ThemedText>
          <ThemedText variant="body" color={tokens.colors.textMuted} style={styles.subtitle}>
            {etapa === 'EMAIL'
              ? 'Informe o e-mail corporativo cadastrado para receber o código OTP de validação.'
              : `Digite o código de 6 dígitos enviado para ${email} e cadastre sua nova senha.`}
          </ThemedText>
        </View>

        <View style={styles.card}>
          {etapa === 'EMAIL' ? (
            <>
              <View style={styles.fieldGroup}>
                <ThemedText variant="caption" style={styles.inputLabel}>
                  E-mail Corporativo
                </ThemedText>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color={tokens.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="gestor@restaurante.com"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading && !isOffline}
                  />
                </View>
              </View>

              {/* Aviso Discreto de Modo Offline */}
              {isOffline && (
                <View
                  style={styles.offlineNotice}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  {...(Platform.OS === 'web' ? { role: 'alert', 'aria-live': 'polite' } : {})}
                >
                  <Ionicons name="cloud-offline-outline" size={16} color="#B45309" />
                  <ThemedText variant="caption" style={styles.offlineNoticeText}>
                    A recuperação de senha via OTP requer conexão ativa com a internet.
                  </ThemedText>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <ThemedText variant="caption" style={styles.inputLabel}>
                  Código de Verificação (6 dígitos)
                </ThemedText>
                <View style={styles.inputBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={tokens.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="000000"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={codigoOtp}
                    onChangeText={(txt) => setCodigoOtp(txt.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText variant="caption" style={styles.inputLabel}>
                  Nova Senha (Mínimo 6 caracteres)
                </ThemedText>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={tokens.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Sua nova senha"
                    placeholderTextColor={tokens.colors.textMuted}
                    secureTextEntry={!mostrarSenha}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setMostrarSenha((prev) => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={mostrarSenha ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={tokens.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText variant="caption" style={styles.inputLabel}>
                  Confirmar Nova Senha
                </ThemedText>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={tokens.colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Repita a nova senha"
                    placeholderTextColor={tokens.colors.textMuted}
                    secureTextEntry={!mostrarSenha}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>
            </>
          )}

          {/* Botão Primário com Coerência Offline */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.actionButton,
              isBotaoDesabilitado && styles.buttonDisabled,
              etapa === 'EMAIL' && isOffline && styles.buttonOffline,
            ]}
            onPress={etapa === 'EMAIL' ? handleSolicitarCodigo : handleRedefinirSenha}
            disabled={isBotaoDesabilitado}
            accessibilityRole="button"
            accessibilityLabel={
              etapa === 'EMAIL' && isOffline
                ? 'Sem Conexão para Enviar'
                : etapa === 'EMAIL'
                  ? 'Enviar Código de Recuperação'
                  : 'Redefinir Senha'
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText variant="body" weight="bold" color="#FFFFFF">
                {etapa === 'EMAIL'
                  ? isOffline
                    ? 'Sem Conexão para Enviar'
                    : 'Enviar Código de Recuperação'
                  : 'Redefinir Senha'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* Ação Secundária com Área de Toque >= 44px e Destaque Semântico */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lembrou sua senha? Voltar ao login"
            onPress={() => router.replace('/(auth)/login')}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.voltarLoginButton,
              (pressed || hovered) && styles.voltarLoginButtonPressed,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText variant="caption" style={styles.voltarLoginTextoNeutro}>
              Lembrou sua senha?{' '}
            </ThemedText>
            <ThemedText variant="caption" style={styles.voltarLoginTextoDestaque}>
              Voltar ao login
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
