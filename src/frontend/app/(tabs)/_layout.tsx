import React from 'react';
import { Tabs } from 'expo-router';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

export default function TabLayout() {
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
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'PDV',
          tabBarIcon: ({ color }) => (
            <ThemedText variant="subtitle" color={color as string}>
              🛒
            </ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: 'Caixa',
          tabBarIcon: ({ color }) => (
            <ThemedText variant="subtitle" color={color as string}>
              📊
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
    </Tabs>
  );
}
