import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CardioType } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type CardioActivity = {
  id: CardioType;
  name: string;
  icon: IconName;
  // Colors reuse the validated categorical palette; names always accompany them.
  color: string;
  tracksDistance: boolean;
  // How speed reads best for this activity.
  speed: 'pace' | 'kmh' | 'per100m' | null;
};

export const CARDIO_ACTIVITIES: CardioActivity[] = [
  { id: 'run', name: 'Correr', icon: 'walk', color: '#2a78d6', tracksDistance: true, speed: 'pace' },
  { id: 'walk', name: 'Caminar', icon: 'footsteps', color: '#1baf7a', tracksDistance: true, speed: 'pace' },
  { id: 'bike', name: 'Bici', icon: 'bicycle', color: '#eb6834', tracksDistance: true, speed: 'kmh' },
  { id: 'elliptical', name: 'Elíptica', icon: 'fitness', color: '#6250d6', tracksDistance: false, speed: null },
  { id: 'row', name: 'Remo', icon: 'boat', color: '#008300', tracksDistance: true, speed: 'per100m' },
  { id: 'swim', name: 'Natación', icon: 'water', color: '#e87ba4', tracksDistance: true, speed: 'per100m' },
  { id: 'hiit', name: 'HIIT', icon: 'flame', color: '#eda100', tracksDistance: false, speed: null },
];

const byId = new Map(CARDIO_ACTIVITIES.map((a) => [a.id, a]));

export function getCardioActivity(id: CardioType): CardioActivity {
  return byId.get(id) ?? CARDIO_ACTIVITIES[0];
}

// WHO guideline for adults: at least 150 minutes of moderate activity a week.
export const DEFAULT_CARDIO_GOAL = 150;
