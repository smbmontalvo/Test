import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

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
      {/* Extra translucent ring around the avatar's own white border. */}
      <View style={styles.ring}>
        <Avatar profile={profile} size={34} />
      </View>
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
  ring: {
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});
