import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { colors } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons name={name} color={focused ? colors.accent : colors.muted} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="rutinas" options={{ title: 'Rutinas', tabBarIcon: tabIcon('barbell') }} />
      <Tabs.Screen name="ejercicios" options={{ title: 'Ejercicios', tabBarIcon: tabIcon('list') }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial', tabBarIcon: tabIcon('stats-chart') }} />
    </Tabs>
  );
}
