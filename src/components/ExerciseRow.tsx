import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, muscleColors, radius, spacing } from '../theme';
import type { Exercise } from '../types';
import { highlightParts } from '../utils/search';
import { PressScale } from './motion';

// One exercise in a list: muscle-colored badge, name with the search words
// highlighted, muscle and equipment, and an optional trailing element.
export function ExerciseRow({
  exercise,
  query = '',
  trailing,
  onPress,
  accessibilityLabel,
}: {
  exercise: Exercise;
  query?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      <View style={[styles.badge, { backgroundColor: muscleColors[exercise.muscle] }]}>
        <Ionicons name="barbell" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {highlightParts(exercise.name, query).map((p, i) => (
              <Text key={i} style={p.match ? styles.match : undefined}>
                {p.text}
              </Text>
            ))}
          </Text>
          {exercise.custom && (
            <View style={styles.mine}>
              <Text style={styles.mineText}>Tuyo</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {exercise.muscle} · {exercise.equipment}
        </Text>
      </View>
      {trailing}
    </>
  );

  const label = accessibilityLabel ?? `${exercise.name}, ${exercise.muscle}, ${exercise.equipment}${exercise.custom ? ', creado por ti' : ''}`;

  return onPress ? (
    <PressScale pressedScale={0.98} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.row}>
      {content}
    </PressScale>
  ) : (
    <View style={styles.row} accessible accessibilityLabel={label}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  name: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  match: { color: colors.accent, fontWeight: '800', backgroundColor: colors.accentSoft },
  mine: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  mineText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
