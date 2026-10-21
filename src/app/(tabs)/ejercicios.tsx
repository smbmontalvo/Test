import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { showAlert } from '../../components/Dialog';
import { ExerciseRow } from '../../components/ExerciseRow';
import { FadeInUp, PressScale } from '../../components/motion';
import { SearchBar } from '../../components/SearchBar';
import { Button, EmptyState } from '../../components/ui';
import { MUSCLE_GROUPS, allExercises } from '../../data/exercises';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useGym } from '../../store/GymContext';
import { colors, muscleColors, radius, spacing } from '../../theme';
import type { Exercise, MuscleGroup } from '../../types';
import { searchExercises } from '../../utils/search';
import { formatWeight, personalRecords } from '../../utils/stats';

type Section = { key: string; title: string; data: Exercise[] };

const RECENT_LIMIT = 6;

export default function ExercisesScreen() {
  const inset = useScreenInsets();
  const { history, customExercises, deleteCustomExercise } = useGym();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const prs = useMemo(() => personalRecords(history), [history]);

  // allExercises() reads the custom-exercise registry GymProvider keeps in
  // sync, so recompute whenever the user's own exercises change.
  const all = useMemo(() => allExercises(), [customExercises]);
  const counts = useMemo(() => {
    const c = new Map<MuscleGroup, number>();
    for (const e of all) c.set(e.muscle, (c.get(e.muscle) ?? 0) + 1);
    return c;
  }, [all]);

  const searching = query.trim().length > 0;
  const results = useMemo(
    () => searchExercises(muscle ? all.filter((e) => e.muscle === muscle) : all, query),
    [all, muscle, query],
  );

  const sections: Section[] = useMemo(() => {
    if (searching || muscle) {
      return results.length ? [{ key: 'results', title: '', data: results }] : [];
    }
    // Browsing: recent and your own first, then the catalog by muscle group.
    const byId = new Map(all.map((e) => [e.id, e]));
    const recent: Exercise[] = [];
    for (const w of history) {
      for (const ex of w.exercises) {
        const e = byId.get(ex.exerciseId);
        if (e && !recent.includes(e) && recent.length < RECENT_LIMIT) recent.push(e);
      }
    }
    const out: Section[] = [];
    if (recent.length) out.push({ key: 'recent', title: 'Hechos recientemente', data: recent });
    const mine = all.filter((e) => e.custom);
    if (mine.length) out.push({ key: 'mine', title: 'Tus ejercicios', data: mine });
    for (const m of MUSCLE_GROUPS) {
      const data = all.filter((e) => e.muscle === m && !e.custom);
      if (data.length) out.push({ key: m, title: m, data });
    }
    return out;
  }, [searching, muscle, results, all, history]);

  const resultLabel = searching
    ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}${muscle ? ` en ${muscle}` : ''}`
    : muscle
      ? `${results.length} ejercicios de ${muscle.toLowerCase()}`
      : `${all.length} ejercicios`;

  const create = (name?: string) =>
    router.push({
      pathname: '/nuevo-ejercicio',
      params: { ...(name ? { nombre: name } : {}), ...(muscle ? { musculo: muscle } : {}) },
    });

  const confirmDelete = (e: Exercise) =>
    showAlert('¿Eliminar ejercicio?', `«${e.name}» se quitará de tus rutinas. Tus entrenamientos pasados no cambian.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteCustomExercise(e.id) },
    ]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(e, i) => `${e.id}-${i}`}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 40 }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Busca por nombre, músculo o equipo" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <FilterChip label="Todos" count={all.length} active={muscle === null} onPress={() => setMuscle(null)} />
            {MUSCLE_GROUPS.map((m) => (
              <FilterChip
                key={m}
                label={m}
                count={counts.get(m) ?? 0}
                color={muscleColors[m]}
                active={muscle === m}
                onPress={() => setMuscle(muscle === m ? null : m)}
              />
            ))}
          </ScrollView>

          <View style={styles.summaryRow}>
            <Text style={styles.summary} accessibilityLiveRegion="polite">
              {resultLabel}
            </Text>
            <Button title="Crear ejercicio" icon="add" onPress={() => create()} accessibilityLabel="Crear tu propio ejercicio" />
          </View>
        </View>
      }
      renderSectionHeader={({ section }) =>
        section.title ? (
          <View style={styles.sectionHeader}>
            {section.key in muscleColors && (
              <View style={[styles.sectionDot, { backgroundColor: muscleColors[section.key as MuscleGroup] }]} />
            )}
            {section.key === 'recent' && <Ionicons name="time-outline" size={16} color={colors.accent} />}
            {section.key === 'mine' && <Ionicons name="person-outline" size={16} color={colors.accent} />}
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        ) : null
      }
      SectionSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListEmptyComponent={
        <FadeInUp style={styles.empty}>
          <EmptyState
            icon="search"
            title="No encontramos ese ejercicio"
            text={
              searching
                ? `Nada coincide con «${query.trim()}». Revisa cómo se escribe o créalo tú.`
                : 'No hay ejercicios en este grupo.'
            }
          />
          {searching && (
            <Button
              title={`Crear «${query.trim()}»`}
              icon="add"
              onPress={() => create(query.trim())}
              style={{ alignSelf: 'center' }}
            />
          )}
        </FadeInUp>
      }
      renderItem={({ item, index }) => {
        const pr = prs[item.id];
        return (
          <FadeInUp delay={Math.min(index, 8) * 35}>
            <ExerciseRow
              exercise={item}
              query={query}
              trailing={
                <>
                  {pr && (
                    <View
                      style={styles.pr}
                      accessible
                      accessibilityLabel={`Récord: ${pr.weight > 0 ? `${pr.weight} kilos por ${pr.reps}` : `${pr.reps} repeticiones`}`}
                    >
                      <Text style={styles.prLabel}>PR</Text>
                      <Text style={styles.prValue}>
                        {pr.weight > 0 ? `${formatWeight(pr.weight)} kg × ${pr.reps}` : `${pr.reps} reps`}
                      </Text>
                    </View>
                  )}
                  {item.custom && (
                    <PressScale
                      onPress={() => confirmDelete(item)}
                      pressedScale={0.85}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${item.name}`}
                      style={styles.trash}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </PressScale>
                  )}
                </>
              }
            />
          </FadeInUp>
        );
      }}
    />
  );
}

function FilterChip({
  label,
  count,
  color,
  active,
  onPress,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale
      onPress={onPress}
      pressedScale={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} ejercicios`}
      style={[styles.chip, active && styles.chipActive]}
    >
      {color && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      <Text style={[styles.chipCount, active && styles.chipTextActive]}>{count}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  filters: { gap: spacing.sm, paddingRight: spacing.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  summary: { color: colors.muted, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionCount: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  empty: { gap: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.accent, fontWeight: '800' },
  chipCount: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  pr: {
    alignItems: 'flex-end',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  prLabel: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  prValue: { color: colors.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  trash: { padding: spacing.xs },
});
