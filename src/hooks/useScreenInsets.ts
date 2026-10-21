import { HeaderHeightContext } from 'expo-router/react-navigation';
import { createContext, useContext } from 'react';

// Space the floating tab bar covers at the bottom of tab screens (0 elsewhere).
export const TabBarSpaceContext = createContext(0);

// The header and tab bar are translucent and float over the content, so
// scrollable screens pad their content by this much to start and end clear of them.
export function useScreenInsets() {
  const top = useContext(HeaderHeightContext) ?? 0;
  const bottom = useContext(TabBarSpaceContext);
  return { top, bottom };
}
