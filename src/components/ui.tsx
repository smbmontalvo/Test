import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { PressScale } from './motion';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  // 'lg' is for a screen's main action: a full 48pt touch target.
  size?: 'md' | 'lg';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  size = 'md',
  accessibilityLabel,
  style,
}: ButtonProps) {
  const fg = variant === 'danger' ? colors.dangerText : colors.accent;
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.button,
        size === 'lg' && styles.buttonLarge,
        variant === 'primary' && { backgroundColor: colors.accentSoft },
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && { backgroundColor: colors.dangerSoft },
        disabled && { opacity: 0.6 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={size === 'lg' ? 20 : 15} color={fg} />}
      <Text style={[styles.buttonText, size === 'lg' && styles.buttonTextLarge, { color: fg }]}>{title}</Text>
    </PressScale>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.muted,
  size = 22,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.5 }}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function Stat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <Card style={styles.stat}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  buttonLarge: { minHeight: 48, paddingVertical: 12, gap: spacing.sm },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.card,
    shadowColor: '#14161B',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: { fontSize: 14, fontWeight: '700' },
  buttonTextLarge: { fontSize: 17 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  stat: { flex: 1, padding: spacing.md, gap: 2 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.xs },
  statLabel: { color: colors.muted, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
});
