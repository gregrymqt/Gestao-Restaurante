import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { ColaboradorEquipe } from '../services/equipeService';
import { styles } from './ModalGestaoEquipe.styles';

interface ColaboradorItemCardProps {
  item: ColaboradorEquipe;
  onAlternarStatus: (item: ColaboradorEquipe) => void;
}

export function ColaboradorItemCard({ item, onAlternarStatus }: ColaboradorItemCardProps) {
  return (
    <View style={styles.colaboradorCard}>
      <View style={[styles.avatarBox, !item.ativo && styles.avatarInativo]}>
        <ThemedText variant="caption" weight="bold" color="#FFFFFF">
          {item.iniciais || 'OP'}
        </ThemedText>
      </View>
      <View style={styles.colaboradorInfo}>
        <View style={styles.nomeRow}>
          <ThemedText variant="body" weight="bold" numberOfLines={1}>
            {item.nome}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleBadgeText}>
              {item.role === 'Manager' ? 'Gestor' : 'Operador'}
            </ThemedText>
          </View>
        </View>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          PIN: {item.possuiPin ? 'Cadastrado ••••' : 'Padrão 1234'}
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={() => onAlternarStatus(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.ativo ? 'Desativar' : 'Reativar'} colaborador ${item.nome}`}
        style={[
          styles.statusActionBtn,
          item.ativo ? styles.btnDesativar : styles.btnAtivar,
        ]}
      >
        <ThemedText
          variant="caption"
          weight="bold"
          color={item.ativo ? tokens.colors.status.redText : tokens.colors.status.greenText}
        >
          {item.ativo ? 'Desativar' : 'Reativar'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}
