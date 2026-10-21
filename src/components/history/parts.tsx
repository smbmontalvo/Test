import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, muscleColors, radius, spacing } from '../../theme';
import type { MuscleGroup } from '../../types';

// Small lime pill marking a personal record. The text says "PR", so the
// meaning never depends on color.
export function PrPill({ label = 'PR', accessibilityLabel = 'Récord personal' }: { label?: string; accessibilityLabel?: string }) {
  return (
    <View style={styles.pr} accessible accessibilityLabel={accessibilityLabel}>
      <Ionicons name="trophy" size={12} color={colors.primaryText} />
      <Text style={styles.prText}>{label}</Text>
    </View>
  );
}

// Muscle groups as a colored dot plus the group name. "inline" is the light
// version for list rows; "chips" puts each group on a white pill.
export function MuscleTags({ muscles, variant = 'inline', max }: { muscles: MuscleGroup[]; variant?: 'inline' | 'chips'; max?: number }) {
  if (muscles.length === 0) return null;
  const shown = max ? muscles.slice(0, max) : muscles;
  const extra = muscles.length - shown.length;
  const chips = variant === 'chips';
  return (
    <View style={[styles.tags, chips && styles.tagsChips]} accessible accessibilityLabel={`Músculos: ${muscles.join(', ')}`}>
      {shown.map((m) => (
        <View key={m} style={[styles.tag, chips && styles.chip]}>
          <View style={[styles.dot, { backgroundColor: muscleColors[m] }]} />
          <Text style={[styles.tagText, chips && styles.chipText]}>{m}</Text>
        </View>
      ))}
      {extra > 0 && <Text style={styles.tagText}>+{extra}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prText: { color: colors.primaryText, fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.md, rowGap: 4 },
  tagsChips: { columnGap: spacing.sm, rowGap: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tagText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipText: { color: colors.text, fontSize: 14 },
});
