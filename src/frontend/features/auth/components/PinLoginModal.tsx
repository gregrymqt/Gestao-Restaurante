import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { authService } from '../services/authService';
import { useAuthStore } from '../hooks/useAuthStore';
import { OperadorRecente } from '../types';
import { styles } from './PinLoginModal.styles';

interface PinLoginModalProps {
  visible: boolean;
  operador: OperadorRecente | null;
  tenantId: string;
  onClose: () => void;
}

export function PinLoginModal({
  visible,
  operador,
  tenantId,
  onClose,
}: PinLoginModalProps) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const currentTenant = useAuthStore((state) => state.tenant);

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setPin('');
    }
  }, [visible]);

  if (!operador) return null;

  const handleLoginPin = async () => {
    if (pin.length !== 4) {
      AppDialog.warning('PIN Incompleto', 'Digite o PIN de 4 dígitos para acessar.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.loginComPin(tenantId, operador.id, pin);

      const activeTenant =
        response.operador.restaurantesVinculados?.[0] ||
        currentTenant || {
          id: tenantId,
          nome: 'Restaurante Local',
          cnpj: '',
          filialNumero: 'Filial PDV',
          ativo: true,
        };

      setSession({
        token: response.token,
        refreshToken: response.refreshToken,
        tenant: activeTenant,
        operador: {
          id: response.operador.id,
          nome: response.operador.nome,
          email: response.operador.email || operador.email,
          role: response.operador.role || 'Operator',
          cargo: response.operador.cargo || 'Operador de PDV',
          matricula: operador.matricula || '0001',
          iniciais: operador.iniciais || 'OP',
        },
      });

      onClose();
      router.replace('/(tabs)/pdv');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'PIN incorreto. Tente novamente.';
      AppDialog.error('Erro de Acesso', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.card}>
            <View style={styles.avatarCircle}>
              <ThemedText style={styles.avatarText}>{operador.iniciais || 'OP'}</ThemedText>
            </View>

            <ThemedText variant="title" weight="bold" style={styles.nomeText}>
              {operador.nome}
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.cargoText}>
              {operador.cargo || 'Operador de Frente de Caixa'}
            </ThemedText>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.pinInput}
                placeholder="••••"
                placeholderTextColor={tokens.colors.textMuted}
                value={pin}
                onChangeText={(val) => setPin(val.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                autoFocus
              />
              <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.hintText}>
                Digite seu PIN numérico de 4 dígitos
              </ThemedText>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose} style={styles.btnCancelar} disabled={isLoading}>
                <ThemedText variant="body" weight="medium" color={tokens.colors.textPrimary}>
                  Voltar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLoginPin}
                style={[styles.btnConfirmar, (pin.length !== 4 || isLoading) && styles.btnDisabled]}
                disabled={pin.length !== 4 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText variant="body" weight="bold" color="#FFFFFF">
                    Entrar no PDV
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
