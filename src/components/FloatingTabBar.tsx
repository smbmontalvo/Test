import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, radius } from '../theme';

const BAR_PADDING = 6;

// Floating, rounded tab bar. A single "bubble" marks the active tab and
// springs across to the new tab instead of disappearing and reappearing.
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
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
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} onLayout={onLayout} role="tablist">
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
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    padding: BAR_PADDING,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    shadowColor: '#14161B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
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
