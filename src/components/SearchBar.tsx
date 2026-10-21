import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { Pop, PressScale } from './motion';

// Rounded search field with a magnifier, a clear button and a green focus ring.
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar ejercicio…',
  autoFocus,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.bar, focused && styles.barFocused]}>
      <Ionicons name="search" size={20} color={focused ? colors.accent : colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        // The bar draws its own focus ring, so drop the browser outline on web.
        style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Buscar ejercicio"
        accessibilityHint="Busca por nombre, grupo muscular o equipo"
      />
      {value.length > 0 && (
        <Pop visible>
          <PressScale
            onPress={() => onChangeText('')}
            pressedScale={0.85}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            style={styles.clear}
          >
            <Ionicons name="close" size={14} color={colors.card} />
          </PressScale>
        </Pop>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    minHeight: 50,
  },
  barFocused: { borderColor: colors.accent },
  input: { flex: 1, minWidth: 0, color: colors.text, fontSize: 16, paddingVertical: 12 },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
