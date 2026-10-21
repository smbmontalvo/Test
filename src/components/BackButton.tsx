import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';
import { haptic, Pop, PressScale } from './motion';

const NATIVE = Platform.OS !== 'web';

// Round back button that matches the profile avatar: it pops in with the
// screen, sinks when pressed and nudges its arrow left before going back.
export function BackButton() {
  const nudge = useRef(new Animated.Value(0)).current;

  const goBack = () => {
    haptic.tap();
    Animated.sequence([
      Animated.timing(nudge, { toValue: 1, duration: 90, useNativeDriver: NATIVE }),
      Animated.spring(nudge, { toValue: 0, useNativeDriver: NATIVE, speed: 30, bounciness: 10 }),
    ]).start();
    setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/')), 90);
  };

  const translateX = nudge.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <Pop visible style={styles.shadow}>
      <PressScale
        onPress={goBack}
        pressedScale={0.88}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={styles.ring}
      >
        <View style={styles.circle}>
          <Animated.View style={{ transform: [{ translateX }] }}>
            <Ionicons name="chevron-back" size={20} color={colors.accent} style={styles.icon} />
          </Animated.View>
        </View>
      </PressScale>
    </Pop>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 12,
    borderRadius: radius.pill,
    shadowColor: '#14161B',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // Same translucent ring as the profile button.
  ring: {
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Chevron glyphs sit slightly right of center; nudge to look centered.
  icon: { marginLeft: -2 },
});
