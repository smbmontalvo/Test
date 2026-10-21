import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, radius } from '../theme';
import { GlassFill } from './Glass';

const BAR_PADDING = 6;

// Floating, rounded tab bar. A single "bubble" marks the active tab and
// springs across to the new tab instead of disappearing and reappearing.
export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  onHeight,
}: BottomTabBarProps & { onHeight?: (height: number) => void }) {
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / state.routes.length : 0;
  const translateX = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (!tabWidth) return;
    const toValue = state.index * tabWidth;
    if (!placed.current) {
      // First layout: put the bubble in place without animating from the left edge.
      translateX.setValue(toValue);
      placed.current = true;
      return;
    }
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 70,
    }).start();
  }, [state.index, tabWidth, translateX]);

  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    // Floats over the screen (no background band) so content shows behind it.
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
      onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
    >
      <View style={styles.bar} onLayout={onLayout} role="tablist">
        <GlassFill tint="rgba(255,255,255,0.6)" style={styles.glass} />
        {tabWidth > 0 && (
          <Animated.View style={[styles.bubble, { width: tabWidth, transform: [{ translateX }] }]} />
        )}
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];
          const color = focused ? colors.accent : colors.muted;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              role="tab"
              aria-selected={focused}
              accessibilityLabel={label}
              style={styles.tab}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text style={[styles.label, { color }, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    padding: BAR_PADDING,
    borderRadius: radius.pill,
    // Extra translucent edge on top of the existing shadow.
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#14161B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  glass: { borderRadius: radius.pill, overflow: 'hidden' },
  bubble: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  label: { fontSize: 11, fontWeight: '600' },
  labelActive: { fontWeight: '800' },
});
