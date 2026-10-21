import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const NATIVE = Platform.OS !== 'web';

// One shared curve for the whole app: quick start, long soft landing.
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

// Module-level copy of the system Reduce Motion setting, for helpers that run
// outside React components (like smoothLayout).
let reduceMotionNow = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => (reduceMotionNow = v))
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduceMotionNow = v));

// Call right before a state change that adds, removes or reorders items, so
// the surrounding layout glides into place instead of jumping.
export function smoothLayout(duration = 280) {
  if (reduceMotionNow) return;
  LayoutAnimation.configureNext({
    duration,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.spring, springDamping: 0.85 },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// Light taps for confirmations; silently ignored where haptics are unavailable.
export const haptic = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  select: () => Haptics.selectionAsync().catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pressable that sinks slightly while pressed and springs back on release.
export function PressScale({
  style,
  pressedScale = 0.96,
  children,
  onPressIn,
  onPressOut,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  children?: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: NATIVE, speed: 40, bounciness: value === 1 ? 8 : 0 }).start();

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        to(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

// Content that rises and fades in when it first appears; delay staggers siblings.
export function FadeInUp({
  delay = 0,
  distance = 14,
  style,
  children,
}: {
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 560,
      delay,
      easing: EASE,
      useNativeDriver: NATIVE,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] });
  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>
  );
}

// Scales its child in with a little overshoot whenever `visible` turns on.
export function Pop({
  visible,
  delay = 0,
  children,
  style,
}: {
  visible: boolean;
  delay?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(visible ? delay : 0),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0,
        useNativeDriver: NATIVE,
        speed: 18,
        bounciness: visible ? 14 : 0,
      }),
    ]).start();
  }, [visible, delay, scale]);
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

// A number that counts up (or down) to its value with the shared easing.
export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  duration = 900,
  delay = 0,
  style,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
}) {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      anim.setValue(value);
      setShown(value);
      return;
    }
    const id = anim.addListener(({ value: v }) => setShown(v));
    const a = Animated.timing(anim, { toValue: value, duration, delay, easing: EASE, useNativeDriver: false });
    a.start(() => setShown(value));
    return () => {
      a.stop();
      anim.removeListener(id);
    };
  }, [value, duration, delay, reduce, anim]);

  return (
    <Text style={style} accessibilityLabel={format(value)}>
      {format(shown)}
    </Text>
  );
}

// A one-off burst of small dots radiating from the center, for celebrations.
const BURST_COLORS = ['#C6F432', '#4D7C0F', '#2a78d6', '#eb6834', '#e87ba4', '#eda100'];

export function Burst({ size = 140, count = 18 }: { size?: number; count?: number }) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
      distance: size * (0.35 + Math.random() * 0.25),
      color: BURST_COLORS[i % BURST_COLORS.length],
      dot: 6 + Math.round(Math.random() * 4),
    })),
  ).current;

  useEffect(() => {
    if (reduce) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
  }, [reduce, progress]);

  if (reduce) return null;
  const opacity = progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  return (
    <View pointerEvents="none" style={[styles.burst, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }]}>
      {particles.map((p, i) => {
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.distance] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.distance] });
        const scale = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1, 0.6] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: size / 2 - p.dot / 2,
              top: size / 2 - p.dot / 2,
              width: p.dot,
              height: p.dot,
              borderRadius: p.dot / 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', left: '50%', top: '50%' },
});
