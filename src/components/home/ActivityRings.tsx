import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, spacing } from '../../theme';
import { CountUp, EASE, useReduceMotion } from '../motion';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Ring = {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  value: number;
  goal: number;
  unit: string;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 148;
const STROKE = 14;
const GAP = 4;

// Concentric progress rings, one per weekly goal, each labelled beside the
// chart so the reading never depends on color alone.
export function ActivityRings({ rings }: { rings: Ring[] }) {
  const spoken = rings
    .map((r) => `${r.label}: ${r.value} de ${r.goal} ${r.unit}`)
    .join('. ');

  return (
    <View style={styles.row} accessible accessibilityLabel={`Tu semana. ${spoken}`}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          {rings.map((r, i) => (
            <RingArc key={r.key} ring={r} index={i} />
          ))}
        </Svg>
      </View>
      <View style={styles.legend}>
        {rings.map((r, i) => (
          <View key={r.key} style={styles.legendRow}>
            <View style={[styles.legendIcon, { backgroundColor: r.color }]}>
              <Ionicons name={r.icon} size={13} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.legendLabel}>{r.label}</Text>
              <Text style={styles.legendValue}>
                <CountUp value={r.value} delay={200 + i * 120} style={styles.legendNumber} />
                <Text style={styles.legendGoal}>
                  {' '}
                  / {r.goal} {r.unit}
                </Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function RingArc({ ring, index }: { ring: Ring; index: number }) {
  const reduce = useReduceMotion();
  const radius = SIZE / 2 - STROKE / 2 - index * (STROKE + GAP);
  const circumference = 2 * Math.PI * radius;
  const target = ring.goal > 0 ? Math.min(1, ring.value / ring.goal) : 0;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      progress.setValue(target);
      return;
    }
    Animated.timing(progress, {
      toValue: target,
      duration: 1200,
      delay: 150 + index * 140,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [target, index, reduce, progress]);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <>
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={radius}
        stroke={ring.color}
        strokeOpacity={0.15}
        strokeWidth={STROKE}
        fill="none"
      />
      <AnimatedCircle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={radius}
        stroke={ring.color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  legend: { flex: 1, gap: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  legendLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  legendValue: { color: colors.text },
  legendNumber: { color: colors.text, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  legendGoal: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
