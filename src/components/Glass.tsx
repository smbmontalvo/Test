import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// Frosted-glass fill: blurs whatever scrolls behind and adds a light tint
// so text on top stays readable.
export function GlassFill({ tint, style }: { tint: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <BlurView tint="light" intensity={40} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
    </View>
  );
}
