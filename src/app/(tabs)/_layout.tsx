import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { FloatingTabBar } from '../../components/FloatingTabBar';
import { ProfileButton } from '../../components/ProfileButton';
import { colors } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons name={focused ? name : (`${name}-outline` as IconName)} color={focused ? colors.accent : colors.muted} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
        sceneStyle: { backgroundColor: colors.bg },
        headerRight: () => <ProfileButton />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerTitle: '', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="rutinas" options={{ title: 'Rutinas', tabBarIcon: tabIcon('barbell') }} />
      <Tabs.Screen name="ejercicios" options={{ title: 'Ejercicios', tabBarIcon: tabIcon('list') }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial', tabBarIcon: tabIcon('stats-chart') }} />
    </Tabs>
  );
}
