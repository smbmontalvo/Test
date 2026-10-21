import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useState, type ComponentProps } from 'react';

import { FloatingTabBar } from '../../components/FloatingTabBar';
import { TabBarSpaceContext } from '../../hooks/useScreenInsets';
import { colors } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons name={focused ? name : (`${name}-outline` as IconName)} color={focused ? colors.accent : colors.muted} size={size} />
  );
}

export default function TabsLayout() {
  const [tabBarSpace, setTabBarSpace] = useState(96);
  return (
    <TabBarSpaceContext.Provider value={tabBarSpace}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} onHeight={setTabBarSpace} />}
        screenOptions={{
          headerShown: false,
          // Content slides a touch when switching tabs.
          animation: 'shift',
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('home') }} />
        <Tabs.Screen name="rutinas" options={{ title: 'Rutinas', tabBarIcon: tabIcon('barbell') }} />
        <Tabs.Screen name="cardio" options={{ title: 'Cardio', tabBarIcon: tabIcon('pulse') }} />
        <Tabs.Screen name="ejercicios" options={{ title: 'Ejercicios', tabBarIcon: tabIcon('list') }} />
        <Tabs.Screen name="historial" options={{ title: 'Historial', tabBarIcon: tabIcon('stats-chart') }} />
      </Tabs>
    </TabBarSpaceContext.Provider>
  );
}
