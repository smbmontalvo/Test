import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Current time that refreshes at midnight and whenever the app comes back to
// the foreground, so day-based screens switch to the new day at 00:00.
export function useToday(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(() => setNow(Date.now()), midnight.getTime() - Date.now() + 500);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [now]);

  return now;
}
