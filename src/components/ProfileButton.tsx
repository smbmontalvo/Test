import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useGym } from '../store/GymContext';
import { radius } from '../theme';
import { Avatar } from './Avatar';

// The profile photo shown at the top right of every screen's header.
export function ProfileButton() {
  const { profile } = useGym();
  return (
    <Pressable
      onPress={() => router.push('/perfil')}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Editar perfil"
      accessibilityHint="Cambia tu foto, nombre o alias"
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
    >
      <Avatar profile={profile} size={38} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 12,
    borderRadius: radius.pill,
    shadowColor: '#14161B',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
