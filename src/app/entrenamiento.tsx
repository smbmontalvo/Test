import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { todayIndex, WEEK_DAYS } from '../components/DayPicker';
import { showAlert } from '../components/Dialog';
import { EASE, FadeInUp, haptic, Pop, PressScale, smoothLayout } from '../components/motion';
import { TopBar } from '../components/TopBar';
import { Button, EmptyState } from '../components/ui';
import { getExercise } from '../data/exercises';
import { useScreenInsets } from '../hooks/useScreenInsets';
import { useGym } from '../store/GymContext';
import { colors, muscleColors, radius, spacing } from '../theme';
import type { MuscleGroup, SetEntry, Workout } from '../types';
import { completedSets, formatClock, formatNumber, workoutVolume } from '../utils/stats';

const DEFAULT_REST_SECONDS = 90;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function ActiveWorkoutScreen() {
  const inset = useScreenInsets();
  const { active, updateActive, finishWorkout, discardWorkout } = useGym();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);

  const restLeft = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : 0;
  useEffect(() => {
    if (restEndsAt && restLeft <= 0) {
      haptic.success();
      setRestEndsAt(null);
    }
  }, [restEndsAt, restLeft]);

  const totalSets = active ? active.exercises.reduce((n, e) => n + e.sets.length, 0) : 0;
  const doneSets = active ? completedSets(active) : 0;

  // Overall progress glides as sets are checked off.
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: totalSets ? doneSets / totalSets : 0,
      duration: 420,
      easing: EASE,
      useNativeDriver: false,
    }).start();
  }, [doneSets, totalSets, progress]);

  if (!active) {
    return (
      <View style={{ flex: 1, padding: spacing.lg, paddingTop: inset.top + spacing.lg }}>
        <TopBar />
        <EmptyState icon="barbell-outline" title="No hay entrenamiento activo" text="Empieza el de hoy desde Inicio." />
      </View>
    );
  }

  const updateSet = (exIndex: number, setIndex: number, patch: Partial<SetEntry>) => {
    updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i === exIndex ? { ...e, sets: e.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) } : e,
      ),
    }));
  };

  const toggleDone = (exIndex: number, setIndex: number) => {
    const set = active.exercises[exIndex].sets[setIndex];
    updateSet(exIndex, setIndex, { done: !set.done });
    if (!set.done) setRestEndsAt(Date.now() + DEFAULT_REST_SECONDS * 1000);
  };

  const addSet = (exIndex: number) => {
    smoothLayout();
    updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) => {
        if (i !== exIndex) return e;
        const last = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { weight: last?.weight ?? '', reps: last?.reps ?? '', done: false }] };
      }),
    }));
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    smoothLayout();
    updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i === exIndex ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) } : e,
      ),
    }));
  };

  const removeExercise = (exIndex: number) => {
    const name = getExercise(active.exercises[exIndex].exerciseId)?.name ?? 'este ejercicio';
    showAlert('Quitar ejercicio', `¿Quitar ${name} del entrenamiento?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          smoothLayout();
          updateActive((w) => ({ ...w, exercises: w.exercises.filter((_, i) => i !== exIndex) }));
        },
      },
    ]);
  };

  const finish = () => {
    const doFinish = () => {
      const saved = finishWorkout();
      if (saved) router.replace(`/workout/${saved.id}`);
    };
    if (doneSets === 0) {
      showAlert('Sin series completadas', 'Marca al menos una serie con ✓ o descarta el entrenamiento.');
      return;
    }
    showAlert('Terminar entrenamiento', `Has completado ${doneSets} series. ¿Guardar y terminar?`, [
      { text: 'Seguir entrenando', style: 'cancel' },
      { text: 'Terminar', onPress: doFinish },
    ]);
  };

  const discard = () => {
    showAlert('Descartar entrenamiento', 'Se perderán todas las series registradas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          router.back();
          discardWorkout();
        },
      },
    ]);
  };

  const muscles: MuscleGroup[] = [];
  for (const e of active.exercises) {
    const m = getExercise(e.exerciseId)?.muscle;
    if (m && !muscles.includes(m)) muscles.push(m);
  }
  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 140 }]}
        scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <TopBar
          right={
            <PressScale onPress={finish} hitSlop={8} accessibilityRole="button" style={styles.finishButton}>
              <Ionicons name="checkmark-done" size={16} color={colors.accent} />
              <Text style={styles.finishText}>Terminar</Text>
            </PressScale>
          }
        />

        {/* Hero, in the home screen's style: what you're doing and how far along. */}
        <FadeInUp>
          <View style={styles.hero}>
            <View style={styles.heroEyebrowRow}>
              <Ionicons name="flash" size={16} color={colors.primaryText} />
              <Text style={styles.heroEyebrow}>En curso · {WEEK_DAYS[todayIndex(now)].long}</Text>
            </View>
            <TextInput
              value={active.name}
              onChangeText={(name) => updateActive((w): Workout => ({ ...w, name }))}
              style={[styles.heroTitle, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
              placeholderTextColor={colors.primaryText}
              multiline
              // Web renders multiline inputs as a two-row textarea by default.
              numberOfLines={Platform.OS === 'web' ? 1 : undefined}
              submitBehavior="blurAndSubmit"
              accessibilityLabel="Nombre del entrenamiento"
            />
            {muscles.length > 0 && (
              <View style={styles.muscles}>
                {muscles.slice(0, 4).map((m) => (
                  <View key={m} style={styles.muscleChip}>
                    <View style={[styles.muscleDot, { backgroundColor: muscleColors[m] }]} />
                    <Text style={styles.muscleText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.stats}>
              <Stat icon="timer-outline" label="Tiempo" value={formatClock((now - active.startedAt) / 1000)} />
              <Stat icon="layers-outline" label="Series" value={`${doneSets}/${totalSets}`} />
              <Stat icon="barbell-outline" label="Kg levantados" value={formatNumber(workoutVolume(active))} />
            </View>

            <View
              style={styles.track}
              accessible
              accessibilityLabel={`${doneSets} de ${totalSets} series hechas`}
            >
              <Animated.View style={[styles.fill, { width: fillWidth }]} />
            </View>
          </View>
        </FadeInUp>

        {active.exercises.map((e, exIndex) => {
          const ex = getExercise(e.exerciseId);
          const exDone = e.sets.filter((s) => s.done).length;
          const complete = e.sets.length > 0 && exDone === e.sets.length;
          return (
            <FadeInUp key={`${e.exerciseId}-${exIndex}`} delay={80 + Math.min(exIndex, 6) * 70}>
              <View style={styles.exCard}>
                <View style={styles.exHeader}>
                  <View style={[styles.badge, { backgroundColor: ex ? muscleColors[ex.muscle] : colors.accent }]}>
                    <Ionicons name="barbell" size={18} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.exName}>{ex?.name ?? e.exerciseId}</Text>
                    {ex && (
                      <Text style={styles.exMeta}>
                        {ex.muscle} · {ex.equipment}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.countPill, complete && styles.countPillDone]}>
                    {complete && <Ionicons name="checkmark" size={12} color={colors.card} />}
                    <Text style={[styles.countText, complete && styles.countTextDone]}>
                      {exDone}/{e.sets.length}
                    </Text>
                  </View>
                  <PressScale
                    onPress={() => removeExercise(exIndex)}
                    pressedScale={0.85}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${ex?.name ?? 'ejercicio'}`}
                    style={styles.remove}
                  >
                    <Ionicons name="close" size={16} color={colors.muted} />
                  </PressScale>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.colIndex]}>Serie</Text>
                  <Text style={[styles.th, styles.colInput]}>Kg</Text>
                  <Text style={[styles.th, styles.colInput]}>Reps</Text>
                  <View style={styles.colAction} />
                </View>

                {e.sets.map((s, setIndex) => (
                  <View key={setIndex} style={[styles.setRow, s.done && styles.setRowDone]}>
                    <Pressable
                      onLongPress={() => removeSet(exIndex, setIndex)}
                      style={styles.colIndex}
                      accessibilityHint="Mantén pulsado para borrar la serie"
                    >
                      <View style={[styles.setNumber, s.done && styles.setNumberDone]}>
                        <Text style={[styles.setNumberText, s.done && styles.setNumberTextDone]}>{setIndex + 1}</Text>
                      </View>
                    </Pressable>
                    <TextInput
                      value={s.weight}
                      onChangeText={(weight) => updateSet(exIndex, setIndex, { weight })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      accessibilityLabel={`Kilos serie ${setIndex + 1}`}
                      style={[styles.input, styles.colInput, s.done && styles.inputDone]}
                    />
                    <TextInput
                      value={s.reps}
                      onChangeText={(reps) => updateSet(exIndex, setIndex, { reps })}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      accessibilityLabel={`Repeticiones serie ${setIndex + 1}`}
                      style={[styles.input, styles.colInput, s.done && styles.inputDone]}
                    />
                    <PressScale
                      pressedScale={0.85}
                      onPress={() => {
                        haptic.tap();
                        toggleDone(exIndex, setIndex);
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: s.done }}
                      accessibilityLabel={`Marcar serie ${setIndex + 1} como hecha`}
                      style={[styles.check, s.done && styles.checkDone, styles.colAction]}
                    >
                      {s.done ? (
                        <Pop visible>
                          <Ionicons name="checkmark" size={20} color={colors.card} />
                        </Pop>
                      ) : (
                        <Ionicons name="checkmark" size={20} color={colors.muted} />
                      )}
                    </PressScale>
                  </View>
                ))}

                <PressScale onPress={() => addSet(exIndex)} hitSlop={8} style={styles.addSet}>
                  <Ionicons name="add" size={15} color={colors.accent} />
                  <Text style={styles.addSetText}>Añadir serie</Text>
                </PressScale>
              </View>
            </FadeInUp>
          );
        })}

        <Text style={styles.hint}>Mantén pulsado el número de una serie para borrarla.</Text>

        <View style={styles.actions}>
          <Button title="Añadir ejercicio" icon="add" variant="secondary" onPress={() => router.push('/elegir-ejercicio')} />
          <Button title="Terminar entrenamiento" icon="checkmark-done" size="lg" onPress={finish} />
          <Button title="Descartar entrenamiento" icon="trash-outline" variant="ghost" onPress={discard} />
        </View>
      </ScrollView>

      {restEndsAt && (
        <FadeInUp distance={40} style={[styles.rest, { bottom: insets.bottom + spacing.lg }]}>
          <View style={styles.restIcon}>
            <Ionicons name="timer-outline" size={20} color={colors.primaryText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.restLabel}>Descanso</Text>
            <Text style={styles.restTime} accessibilityLiveRegion="polite">
              {formatClock(restLeft)}
            </Text>
          </View>
          <RestButton label="−15" spoken="Quitar 15 segundos" onPress={() => setRestEndsAt(Math.max(Date.now(), restEndsAt - 15000))} />
          <RestButton label="+15" spoken="Añadir 15 segundos" onPress={() => setRestEndsAt(restEndsAt + 15000)} />
          <RestButton label="Saltar" spoken="Saltar descanso" onPress={() => setRestEndsAt(null)} />
        </FadeInUp>
      )}
    </KeyboardAvoidingView>
  );
}

function Stat({ icon, label, value }: { icon: 'timer-outline' | 'layers-outline' | 'barbell-outline'; label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={16} color={colors.primaryText} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RestButton({ label, spoken, onPress }: { label: string; spoken: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} pressedScale={0.88} hitSlop={6} accessibilityRole="button" accessibilityLabel={spoken} style={styles.restBtn}>
      <Text style={styles.restBtnText}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  finishText: { color: colors.accent, fontWeight: '800', fontSize: 14 },

  hero: { backgroundColor: colors.primary, borderRadius: 28, padding: spacing.xl, gap: spacing.sm },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: { color: colors.primaryText, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: {
    color: colors.primaryText,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
    padding: 0,
  },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  muscleDot: { width: 8, height: 8, borderRadius: 4 },
  muscleText: { color: colors.primaryText, fontSize: 13, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  statValue: { color: colors.primaryText, fontSize: 18, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.primaryText, fontSize: 12, fontWeight: '600', opacity: 0.7 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(20,22,27,0.15)', overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primaryText },

  exCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  exName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  exMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countPillDone: { backgroundColor: colors.accent },
  countText: { color: colors.muted, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countTextDone: { color: colors.card },
  remove: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },

  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 6 },
  th: { color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  colIndex: { width: 40, alignItems: 'center' },
  colInput: { flex: 1, minWidth: 0 },
  colAction: { width: 46 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 6,
    borderRadius: 16,
  },
  setRowDone: { backgroundColor: colors.accentSoft },
  setNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  setNumberDone: { backgroundColor: colors.accent },
  setNumberText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  setNumberTextDone: { color: colors.card },
  input: {
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: radius.md,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inputDone: { backgroundColor: colors.card },
  check: {
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.accent },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    marginTop: spacing.sm,
  },
  addSetText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  actions: { gap: spacing.sm },

  // Floating rest timer, shaped like the tab bar.
  rest: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#14161B',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  restIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  restLabel: { color: colors.primaryText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, opacity: 0.75 },
  restTime: { color: colors.primaryText, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  restBtn: { backgroundColor: colors.card, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill },
  restBtnText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
});
