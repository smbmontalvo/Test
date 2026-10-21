import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme';
import { BackButton } from './BackButton';

// Replaces the header on screens opened from another one: the round back
// button on the left and an optional action on the right, in the content.
export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <View style={styles.bar}>
      <BackButton />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
