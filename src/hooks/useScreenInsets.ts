import { createContext, useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Space the floating tab bar covers at the bottom of tab screens (0 elsewhere).
export const TabBarSpaceContext = createContext(0);

// There is no header, so content starts below the status bar; the floating
// tab bar overlaps the bottom of tab screens. Scrollable screens pad their
// content by these amounts so nothing starts or ends hidden.
export function useScreenInsets() {
  const safe = useSafeAreaInsets();
  const tabBar = useContext(TabBarSpaceContext);
  return { top: safe.top, bottom: Math.max(tabBar, safe.bottom) };
}
