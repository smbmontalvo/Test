import { router } from 'expo-router';
import { useCallback } from 'react';

import { showAlert } from '../components/Dialog';
import { useGym } from '../store/GymContext';

// Starts a workout and opens it, asking first if another one is in progress.
export function useStartWorkout() {
  const { active, startWorkout } = useGym();

  return useCallback(
    (routineId?: string) => {
      const begin = () => {
        startWorkout(routineId);
        router.push('/entrenamiento');
      };

      if (!active) {
        begin();
        return;
      }

      showAlert('Entrenamiento en curso', `Ya tienes "${active.name}" sin terminar.`, [
        { text: 'Continuar el actual', onPress: () => router.push('/entrenamiento') },
        { text: 'Descartar y empezar', style: 'destructive', onPress: begin },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    },
    [active, startWorkout],
  );
}
