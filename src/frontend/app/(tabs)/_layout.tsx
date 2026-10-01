import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarStyle: {
          backgroundColor: tokens.colors.card,
          borderTopColor: tokens.colors.border,
          height: 52 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
      }}
    >
      {/* 4 Abas Principais Visíveis (Ergonomia HIG / Material 3) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color }) => (
            <ThemedText variant="subtitle" color={color as string}>
              📈
            </ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ color }) => (
            <ThemedText variant="subtitle" color={color as string}>
              📦
            </ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="previsoes"
        options={{
          title: 'Previsões',
          tabBarIcon: ({ color }) => (
            <ThemedText variant="subtitle" color={color as string}>
              🤖
            </ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color }) => (
            <ThemedText variant="subtitle" color={color as string}>
              ⚙️
            </ThemedText>
          ),
        }}
      />

      {/* Rotas auxiliares ocultas da barra inferior mantendo deep linking */}
      <Tabs.Screen
        name="pdv"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
