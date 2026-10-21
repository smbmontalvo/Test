import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { formatKm, type CardioWeek } from '../utils/cardio';
import { WEEK_DAYS } from './DayPicker';
import { EASE, CountUp, useReduceMotion } from './motion';

const BAR_AREA = 56;
const NATIVE = Platform.OS !== 'web';

// Weekly cardio at a glance: minutes against the goal, a progress bar and
// minutes per day. Read-only; the home widget and the Cardio tab share it.
export function CardioWeekSummary({
  week,
  goal,
  today,
  tone = 'card',
}: {
  week: CardioWeek;
  goal: number;
  today: number;
  tone?: 'card' | 'lime';
}) {
  const reduce = useReduceMotion();
  const ratio = goal > 0 ? Math.min(1, week.minutes / goal) : 0;
  const reached = week.minutes >= goal && goal > 0;
  const left = Math.max(0, goal - week.minutes);
  const onLime = tone === 'lime';

  const fill = useRef(new Animated.Value(0)).current;
  const bars = useRef(WEEK_DAYS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduce) {
      fill.setValue(ratio);
      bars.forEach((b) => b.setValue(1));
      return;
    }
    Animated.parallel([
      Animated.timing(fill, { toValue: ratio, duration: 700, easing: EASE, useNativeDriver: false }),
      Animated.stagger(
        60,
        bars.map((b) =>
          Animated.spring(b, { toValue: 1, useNativeDriver: NATIVE, speed: 12, bounciness: 8 }),
        ),
      ),
    ]).start();
  }, [ratio, reduce, fill, bars]);

  const max = Math.max(1, ...week.perDay);
  const ink = onLime ? colors.primaryText : colors.text;
  const soft = onLime ? 'rgba(20,22,27,0.65)' : colors.muted;

  const spoken =
    `Cardio esta semana: ${week.minutes} de ${goal} minutos` +
    (reached ? ', meta cumplida' : `, faltan ${left}`) +
    `. ${week.sessions} sesiones, ${formatKm(week.km)} kilómetros. ` +
    WEEK_DAYS.map((d, i) => `${d.long} ${week.perDay[i]} minutos`).join(', ');

  return (
    <View accessible accessibilityLabel={spoken} style={styles.wrap}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.big, { color: ink }]}>
            <CountUp value={week.minutes} />
            <Text style={[styles.of, { color: soft }]}> / {goal} min</Text>
          </Text>
          <Text style={[styles.caption, { color: soft }]}>
            {reached ? '¡Meta semanal cumplida!' : `Te faltan ${left} min para tu meta`}
          </Text>
        </View>
        {reached && (
          <View style={[styles.badge, onLime && { backgroundColor: colors.card }]}>
            <Ionicons name="trophy" size={18} color={colors.accent} />
          </View>
        )}
      </View>

      <View style={[styles.track, onLime && styles.trackOnLime]}>
        <Animated.View
          style={[
            styles.fill,
            onLime && { backgroundColor: colors.primaryText },
            { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>

      {/* Minutes per day; bars grow from a shared zero baseline. */}
      <View style={styles.chart}>
        {WEEK_DAYS.map((d, i) => {
          const value = week.perDay[i];
          const height = value > 0 ? Math.max(6, (value / max) * BAR_AREA) : 4;
          return (
            <View key={d.short} style={styles.col}>
              <Text style={[styles.value, { color: soft }]}>{value > 0 ? value : ''}</Text>
              <View style={styles.barArea}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor:
                        value > 0 ? (onLime ? colors.primaryText : colors.accent) : onLime ? 'rgba(20,22,27,0.15)' : colors.cardAlt,
                      transform: [{ scaleY: bars[i] }],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.day, { color: i === today ? ink : soft }, i === today && styles.dayToday]}>
                {d.short}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.footer, { color: soft }]}>
        <Text style={{ color: ink, fontWeight: '800' }}>{week.sessions}</Text> {week.sessions === 1 ? 'sesión' : 'sesiones'} ·{' '}
        <Text style={{ color: ink, fontWeight: '800' }}>{formatKm(week.km)}</Text> km ·{' '}
        <Text style={{ color: ink, fontWeight: '800' }}>{week.activeDays}</Text> {week.activeDays === 1 ? 'día activo' : 'días activos'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  big: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  of: { fontSize: 17, fontWeight: '700', letterSpacing: 0 },
  caption: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  trackOnLime: { backgroundColor: 'rgba(20,22,27,0.15)' },
  fill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
  chart: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 11, fontWeight: '700', height: 14, fontVariant: ['tabular-nums'] },
  barArea: { height: BAR_AREA, justifyContent: 'flex-end', alignItems: 'center', alignSelf: 'stretch' },
  bar: {
    width: '70%',
    maxWidth: 24,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    transformOrigin: 'bottom',
  },
  day: { fontSize: 12, fontWeight: '600' },
  dayToday: { fontWeight: '800' },
  footer: { fontSize: 14 },
});
