import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { EASE, useReduceMotion } from './motion';

const TICK_WIDTH = 3;
const TICK_GAP = 3;
const TICK_HEIGHT = 24;
const STAGGER_MS = 16;

// A bar drawn as a row of thin vertical ticks. On mount the ticks rise one
// after another from left to right, and the percentage counts up alongside.
export function TickBar({
  fraction,
  color,
  percent,
  label,
  detail,
  delay = 0,
}: {
  fraction: number; // 0..1 of the track
  color: string;
  percent: number;
  label: string;
  detail?: string;
  delay?: number;
}) {
  const reduceMotion = useReduceMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const capacity = Math.floor((trackWidth + TICK_GAP) / (TICK_WIDTH + TICK_GAP));
  const filled = trackWidth ? Math.max(1, Math.round(capacity * Math.min(1, Math.max(0, fraction)))) : 0;

  const ticks = useRef<Animated.Value[]>([]);
  while (ticks.current.length < filled) ticks.current.push(new Animated.Value(0));

  const counter = useRef(new Animated.Value(0)).current;
  const [shownPercent, setShownPercent] = useState(0);

  useEffect(() => {
    if (!filled) return;
    const values = ticks.current.slice(0, filled);
    if (reduceMotion) {
      values.forEach((v) => v.setValue(1));
      setShownPercent(percent);
      return;
    }
    const nativeDriver = Platform.OS !== 'web';
    const id = counter.addListener(({ value }) => setShownPercent(Math.round(value)));
    const rise = Animated.stagger(
      STAGGER_MS,
      values.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(2)), useNativeDriver: nativeDriver }),
      ),
    );
    const count = Animated.timing(counter, {
      toValue: percent,
      duration: filled * STAGGER_MS + 260,
      easing: EASE,
      useNativeDriver: false,
    });
    const anim = Animated.sequence([Animated.delay(delay), Animated.parallel([rise, count])]);
    anim.start();
    return () => {
      anim.stop();
      counter.removeListener(id);
    };
  }, [filled, percent, delay, reduceMotion, counter]);

  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${percent}% de mejora${detail ? `, ${detail}` : ''}`}>
      <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        {ticks.current.slice(0, filled).map((v, i) => (
          <Animated.View
            key={i}
            style={[styles.tick, { backgroundColor: color, opacity: v, transform: [{ scaleY: v }] }]}
          />
        ))}
      </View>
      <View style={styles.caption}>
        <Text style={styles.percent}>+{shownPercent}%</Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6 },
  track: { flexDirection: 'row', alignItems: 'flex-end', gap: TICK_GAP, height: TICK_HEIGHT },
  tick: {
    width: TICK_WIDTH,
    height: TICK_HEIGHT,
    borderRadius: TICK_WIDTH / 2,
    transformOrigin: 'bottom',
  },
  caption: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  percent: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  label: { color: colors.text, fontSize: 17, flexShrink: 1 },
  detail: { color: colors.muted, fontSize: 14, marginTop: -2 },
});
