import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

export const WEEK_DAYS = [
  { short: 'L', long: 'Lunes' },
  { short: 'M', long: 'Martes' },
  { short: 'X', long: 'Miércoles' },
  { short: 'J', long: 'Jueves' },
  { short: 'V', long: 'Viernes' },
  { short: 'S', long: 'Sábado' },
  { short: 'D', long: 'Domingo' },
];

// Index of today in WEEK_DAYS (0 = Monday).
export function todayIndex(now = Date.now()): number {
  return (new Date(now).getDay() + 6) % 7;
}

// Seven round toggles, one per weekday, for planning when a routine is trained.
export function DayPicker({ value = [], onChange }: { value?: number[]; onChange: (days: number[]) => void }) {
  const toggle = (day: number) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));

  return (
    <View style={styles.row}>
      {WEEK_DAYS.map((d, i) => {
        const on = value.includes(i);
        return (
          <Pressable
            key={d.short}
            onPress={() => toggle(i)}
            hitSlop={4}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={d.long}
            style={({ pressed }) => [styles.day, on && styles.dayOn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.dayText, on && styles.dayTextOn]}>{d.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function formatDays(days: number[] = []): string {
  if (days.length === 0) return 'Sin días asignados';
  return days.map((d) => WEEK_DAYS[d].long).join(', ');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.accentSoft, borderWidth: 1.5, borderColor: colors.accent },
  dayText: { color: colors.muted, fontWeight: '700', fontSize: 14 },
  dayTextOn: { color: colors.accent, fontWeight: '800' },
});
