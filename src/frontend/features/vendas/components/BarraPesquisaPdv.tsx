import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { Search, X } from 'lucide-react-native';

interface BarraPesquisaPdvProps {
  valor: string;
  aoMudarTexto: (texto: string) => void;
  aoLimpar?: () => void;
}

export function BarraPesquisaPdv({
  valor,
  aoMudarTexto,
  aoLimpar,
}: BarraPesquisaPdvProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Search size={18} color={tokens.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          accessibilityRole="search"
          accessibilityLabel="Campo de busca de produtos"
          style={styles.input}
          placeholder="Buscar por nome ou SKU..."
          placeholderTextColor={tokens.colors.textMuted}
          value={valor}
          onChangeText={aoMudarTexto}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {valor.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            style={styles.clearButton}
            onPress={aoLimpar ?? (() => aoMudarTexto(''))}
          >
            <X size={16} color={tokens.colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    height: 48,
    paddingHorizontal: tokens.spacing.md,
  },
  searchIcon: {
    marginRight: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  clearButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
