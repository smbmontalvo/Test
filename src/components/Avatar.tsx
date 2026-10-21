import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { Profile } from '../types';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

// Profile photo, or the person's initials, or a generic person icon.
export function Avatar({ profile, size = 44 }: { profile: Profile; size?: number }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (profile.photo) {
    return <Image source={{ uri: profile.photo }} style={[styles.base, shape]} accessibilityIgnoresInvertColors />;
  }
  const text = initials(profile.alias || profile.name);
  return (
    <View style={[styles.base, styles.placeholder, shape]}>
      {text ? (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{text}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color={colors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 2, borderColor: colors.card },
  placeholder: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.accent, fontWeight: '800' },
});
