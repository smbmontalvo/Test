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
          // No header anywhere: content starts at the top of the screen and
          // screens that can go back show their own round back button.
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          // Same slide-in on iOS and Android; modals rise from the bottom.
          animation: 'ios_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="rutina/[id]" options={{ title: 'Editar rutina' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Entrenamiento' }} />
        <Stack.Screen name="entrenamiento" options={{ title: 'Entrenamiento', gestureEnabled: false }} />
        <Stack.Screen name="perfil" options={{ title: 'Tu perfil', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="animo" options={{ title: 'Tu progreso' }} />
        <Stack.Screen
          name="elegir-ejercicio"
          options={{ title: 'Añadir ejercicio', presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="nuevo-ejercicio"
          options={{ title: 'Nuevo ejercicio', presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      <DialogHost />
    </GymProvider>
  );
}
