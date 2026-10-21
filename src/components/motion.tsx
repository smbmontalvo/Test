import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const NATIVE = Platform.OS !== 'web';

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
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, reduce, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// Scales its child in with a little overshoot whenever `visible` turns on.
export function Pop({ visible, children, style }: { visible: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: visible ? 1 : 0,
      useNativeDriver: NATIVE,
      speed: 18,
      bounciness: visible ? 14 : 0,
    }).start();
  }, [visible, scale]);
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
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
