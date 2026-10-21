import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { BackButton } from '../components/BackButton';
import { DialogHost } from '../components/Dialog';
import { ProfileButton } from '../components/ProfileButton';
import { GymProvider } from '../store/GymContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <GymProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          // No titles in the header on any screen: only back arrow and profile.
          headerTitle: '',
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
          headerRight: () => <ProfileButton />,
          headerLeft: ({ canGoBack }) => (canGoBack ? <BackButton /> : null),
          headerBackVisible: false,
          // Same slide-in on iOS and Android; modals rise from the bottom.
          animation: 'ios_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="rutina/[id]" options={{ title: 'Editar rutina' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Entrenamiento' }} />
        <Stack.Screen name="entrenamiento" options={{ title: 'Entrenamiento', gestureEnabled: false }} />
        <Stack.Screen name="perfil" options={{ title: 'Tu perfil', presentation: 'modal', headerRight: () => null, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="animo" options={{ title: 'Tu progreso' }} />
        <Stack.Screen name="elegir-ejercicio" options={{ title: 'Añadir ejercicio', presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="nuevo-ejercicio" options={{ title: 'Nuevo ejercicio', presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <DialogHost />
    </GymProvider>
  );
}
