import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DialogHost } from '../components/Dialog';
import { GymProvider } from '../store/GymContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <GymProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="rutina/[id]" options={{ title: 'Editar rutina' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Detalle' }} />
        <Stack.Screen name="entrenamiento" options={{ title: 'Entrenamiento', gestureEnabled: false }} />
        <Stack.Screen name="perfil" options={{ title: 'Tu perfil', presentation: 'modal' }} />
        <Stack.Screen name="animo" options={{ title: 'Tu progreso' }} />
        <Stack.Screen name="elegir-ejercicio" options={{ title: 'Añadir ejercicio', presentation: 'modal' }} />
      </Stack>
      <DialogHost />
    </GymProvider>
  );
}
