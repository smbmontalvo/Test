import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ExerciseRow } from '../components/ExerciseRow';
import { FadeInUp, haptic, Pop, PressScale } from '../components/motion';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/ui';
import { allExercises } from '../data/exercises';
import { useScreenInsets } from '../hooks/useScreenInsets';
import { useGym } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';
import { searchExercises } from '../utils/search';
import { TopBar } from '../components/TopBar';

// Modal exercise picker. With ?rutina=<id> it adds to that routine,
// otherwise it adds to the workout in progress.
export default function ExercisePickerScreen() {
  const inset = useScreenInsets();
  const { rutina } = useLocalSearchParams<{ rutina?: string }>();
  const { routines, customExercises, updateRoutine, addExerciseToActive } = useGym();
  const [query, setQuery] = useState('');

  const routine = routines.find((r) => r.id === rutina);
  // allExercises() reads the custom-exercise registry, so refresh with it.
  const all = useMemo(() => allExercises(), [customExercises]);
  const results = useMemo(() => searchExercises(all, query), [all, query]);

  const pick = (exerciseId: string) => {
    haptic.tap();
    if (routine) {
      if (!routine.exerciseIds.includes(exerciseId)) {
        updateRoutine(routine.id, { exerciseIds: [...routine.exerciseIds, exerciseId] });
      }
    } else {
      addExerciseToActive(exerciseId);
    }
    router.back();
  };

  const create = () =>
    router.push({ pathname: '/nuevo-ejercicio', params: query.trim() ? { nombre: query.trim() } : {} });

  return (
    <FlatList
      data={results}
      keyExtractor={(e) => e.id}
      contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 40 }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <TopBar />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Busca por nombre, músculo o equipo" autoFocus />
          <PressScale
            onPress={create}
            pressedScale={0.98}
            accessibilityRole="button"
            accessibilityLabel={query.trim() ? `Crear ejercicio ${query.trim()}` : 'Crear ejercicio nuevo'}
            accessibilityHint="Abre un formulario para crear tu propio ejercicio"
            style={styles.createRow}
          >
            <View style={styles.createIcon}>
              <Ionicons name="add" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createTitle}>{query.trim() ? `Crear «${query.trim()}»` : 'Crear ejercicio'}</Text>
              <Text style={styles.createText}>¿No está en la lista? Añade el tuyo.</Text>
            </View>
          </PressScale>
          <Text style={styles.summary} accessibilityLiveRegion="polite">
            {query.trim()
              ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`
              : `${all.length} ejercicios`}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="search" title="Sin resultados" text="Revisa cómo se escribe o créalo arriba." />
      }
      renderItem={({ item, index }) => {
        const added = routine?.exerciseIds.includes(item.id) ?? false;
        return (
          <FadeInUp delay={Math.min(index, 8) * 30}>
            <ExerciseRow
              exercise={item}
              query={query}
              onPress={() => pick(item.id)}
              accessibilityLabel={`${added ? 'Ya en la rutina: ' : 'Añadir '}${item.name}, ${item.muscle}`}
              trailing={
                added ? (
                  <Pop visible>
                    <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                  </Pop>
                ) : (
                  <View style={styles.addButton}>
                    <Ionicons name="add" size={20} color={colors.accent} />
                  </View>
                )
              }
            />
          </FadeInUp>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  header: { gap: spacing.md, marginBottom: spacing.md },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  createIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  createText: { color: colors.text, fontSize: 13, marginTop: 2, opacity: 0.75 },
  summary: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
