import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, AlertTriangle } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { styles } from './ModalBloqueioTerminal.styles';

interface ModalBloqueioTerminalProps {
  visible: boolean;
  operadorNome: string;
  operadorIniciais: string;
  onDesbloquear: (pin: string) => Promise<boolean | void> | boolean | void;
  onLogout: () => void;
}

export function ModalBloqueioTerminal({
  visible,
  operadorNome,
  operadorIniciais,
  onDesbloquear,
  onLogout,
}: ModalBloqueioTerminalProps) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const [isCarregando, setIsCarregando] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleTentarDesbloqueio = async () => {
    if (pin.length < 4) {
      setErroMensagem('Digite o PIN de 4 dígitos.');
      return;
    }

    try {
      setIsCarregando(true);
      setErroMensagem(null);
      await onDesbloquear(pin);
      setPin('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PIN incorreto. Tente novamente.';
      setErroMensagem(msg);
    } finally {
      setIsCarregando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {}}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'web' && {
              paddingBottom: Math.max(24, insets.bottom + 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Avatar com Badge de Cadeado Ancorado no Canto Inferior Direito */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{operadorIniciais}</ThemedText>
              </View>
              <View style={styles.lockBadge}>
                <Lock size={13} color="#FFFFFF" />
              </View>
            </View>

            <ThemedText variant="title" style={styles.title}>
              Terminal Bloqueado
            </ThemedText>
            <ThemedText variant="body" color={tokens.colors.textMuted} style={styles.subtitle}>
              Sessão de {operadorNome} pausada. O caixa e as rotinas fiscais permanecem abertos.
            </ThemedText>

            {/* Campo de PIN */}
            <View style={styles.pinContainer}>
              <ThemedText variant="caption" weight="bold" style={styles.pinLabel}>
                DIGITE O PIN DE DESBLOQUEIO:
              </ThemedText>
              <TextInput
                style={[
                  styles.pinInput,
                  isFocused && styles.pinInputFocused,
                  !!erroMensagem && styles.pinInputError,
                ]}
                placeholder={pin.length === 0 ? '••••' : ''}
                placeholderTextColor="#D1D5DB"
                keyboardType="number-pad"
                inputMode="numeric"
                secureTextEntry
                maxLength={4}
                value={pin}
                editable={!isCarregando}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChangeText={(txt) => {
                  const cleaned = txt.replace(/\D/g, '').slice(0, 4);
                  setPin(cleaned);
                  if (erroMensagem) setErroMensagem(null);
                }}
                autoFocus
                {...(Platform.OS === 'web' ? { type: 'password', pattern: '[0-9]*' } : {})}
              />

              {/* Feedback de Erro Estável sem Salto no Layout */}
              <View
                style={styles.errorContainer}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                {...(Platform.OS === 'web' ? { role: 'alert', 'aria-live': 'polite' } : {})}
              >
                {erroMensagem ? (
                  <View style={styles.errorRow}>
                    <AlertTriangle size={14} color="#DC2626" />
                    <ThemedText variant="caption" style={styles.errorText}>
                      {erroMensagem}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Botões de Ação */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.desbloquearButton, isCarregando && styles.buttonDisabled]}
              onPress={handleTentarDesbloqueio}
              disabled={isCarregando}
              accessibilityRole="button"
              accessibilityLabel="Desbloquear Terminal"
            >
              {isCarregando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText variant="body" weight="bold" color="#FFFFFF">
                  Desbloquear Terminal
                </ThemedText>
              )}
            </TouchableOpacity>

            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.trocarButton,
                (pressed || hovered) && styles.trocarButtonPressed,
              ]}
              onPress={onLogout}
              disabled={isCarregando}
              accessibilityRole="button"
              accessibilityLabel="Trocar de Operador ou Sair"
            >
              <ThemedText variant="caption" style={styles.trocarText}>
                Trocar de Operador ou Sair
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
