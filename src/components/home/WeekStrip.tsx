import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../theme';
import { WEEK_DAYS } from '../DayPicker';
import { Pop } from '../motion';

// Calendar strip for the current week: weekday, date, today highlighted, a
// filled dot on days with activity and a hollow one on planned days ahead.
export function WeekStrip({
  weekStart,
  today,
  active,
  planned,
}: {
  weekStart: number;
  today: number;
  active: Set<number>;
  planned: Set<number>;
}) {
  return (
    <View style={styles.row}>
      {WEEK_DAYS.map((d, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const isToday = i === today;
        const did = active.has(i);
        const plan = planned.has(i) && !did && i >= today;
        return (
          <View
            key={d.short}
            style={[styles.day, isToday && styles.dayToday]}
            accessible
            accessibilityLabel={`${d.long} ${date.getDate()}${isToday ? ', hoy' : ''}${did ? ', entrenaste' : plan ? ', planificado' : ''}`}
          >
            <Text style={[styles.letter, isToday && styles.textToday]}>{d.short}</Text>
            <Text style={[styles.date, isToday && styles.textToday]}>{date.getDate()}</Text>
            <View style={styles.dotSlot}>
              {did ? (
                <Pop visible delay={250 + i * 60}>
                  <View style={[styles.dot, isToday ? styles.dotOnToday : styles.dotDone]} />
                </Pop>
              ) : plan ? (
                <View style={[styles.dot, styles.dotPlanned, isToday && styles.dotPlannedToday]} />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
    gap: 2,
  },
  dayToday: { backgroundColor: colors.text },
  letter: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  date: { color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  textToday: { color: colors.card },
  dotSlot: { height: 8, justifyContent: 'center', marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotDone: { backgroundColor: colors.accent },
  dotOnToday: { backgroundColor: colors.primary },
  dotPlanned: { borderWidth: 1.5, borderColor: colors.muted },
  dotPlannedToday: { borderColor: colors.card },
});
