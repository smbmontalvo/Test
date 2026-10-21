import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
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

import { Button, Card, EmptyState, IconButton } from '../components/ui';
import { getExercise } from '../data/exercises';
import { useGym } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';
import type { SetEntry, Workout } from '../types';
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
  const { active, updateActive, finishWorkout, discardWorkout } = useGym();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);

  const restLeft = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : 0;
  useEffect(() => {
    if (restEndsAt && restLeft <= 0) setRestEndsAt(null);
  }, [restEndsAt, restLeft]);

  if (!active) {
    return (
      <View style={{ flex: 1, padding: spacing.lg }}>
        <EmptyState icon="barbell-outline" title="No hay entrenamiento activo" text="Empieza uno desde Inicio o Rutinas." />
        <Button title="Volver" variant="secondary" onPress={() => router.back()} />
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
    updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i === exIndex ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) } : e,
      ),
    }));
  };

  const removeExercise = (exIndex: number) => {
    const name = getExercise(active.exercises[exIndex].exerciseId)?.name ?? 'este ejercicio';
    Alert.alert('Quitar ejercicio', `¿Quitar ${name} del entrenamiento?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => updateActive((w) => ({ ...w, exercises: w.exercises.filter((_, i) => i !== exIndex) })),
      },
    ]);
  };

  const finish = () => {
    const done = completedSets(active);
    const doFinish = () => {
      const saved = finishWorkout();
      if (saved) router.replace(`/workout/${saved.id}`);
    };
    if (done === 0) {
      Alert.alert('Sin series completadas', 'Marca al menos una serie con ✓ o descarta el entrenamiento.');
      return;
    }
    Alert.alert('Terminar entrenamiento', `Has completado ${done} series. ¿Guardar y terminar?`, [
      { text: 'Seguir entrenando', style: 'cancel' },
      { text: 'Terminar', onPress: doFinish },
    ]);
  };

  const discard = () => {
    Alert.alert('Descartar entrenamiento', 'Se perderán todas las series registradas.', [
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: formatClock((now - active.startedAt) / 1000),
          headerRight: () => (
            <Pressable onPress={finish} hitSlop={8}>
              <Text style={styles.finishText}>Terminar</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextInput
          value={active.name}
          onChangeText={(name) => updateActive((w): Workout => ({ ...w, name }))}
          style={styles.title}
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.summary}>
          {completedSets(active)} series · {formatNumber(workoutVolume(active))} kg
        </Text>

        {active.exercises.map((e, exIndex) => {
          const ex = getExercise(e.exerciseId);
          return (
            <Card key={`${e.exerciseId}-${exIndex}`} style={styles.exCard}>
              <View style={styles.exHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex?.name ?? e.exerciseId}</Text>
                  {ex && <Text style={styles.exMeta}>{ex.muscle}</Text>}
                </View>
                <IconButton icon="close" onPress={() => removeExercise(exIndex)} />
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colIndex]}>Serie</Text>
                <Text style={[styles.th, styles.colInput]}>Kg</Text>
                <Text style={[styles.th, styles.colInput]}>Reps</Text>
                <View style={styles.colAction} />
              </View>

              {e.sets.map((s, setIndex) => (
                <View key={setIndex} style={[styles.setRow, s.done && styles.setRowDone]}>
                  <Pressable onLongPress={() => removeSet(exIndex, setIndex)} style={styles.colIndex}>
                    <Text style={styles.setIndex}>{setIndex + 1}</Text>
                  </Pressable>
                  <TextInput
                    value={s.weight}
                    onChangeText={(weight) => updateSet(exIndex, setIndex, { weight })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.colInput]}
                  />
                  <TextInput
                    value={s.reps}
                    onChangeText={(reps) => updateSet(exIndex, setIndex, { reps })}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.colInput]}
                  />
                  <Pressable
                    onPress={() => toggleDone(exIndex, setIndex)}
                    style={[styles.check, s.done && styles.checkDone, styles.colAction]}
                  >
                    <Ionicons name="checkmark" size={20} color={s.done ? colors.primaryText : colors.muted} />
                  </Pressable>
                </View>
              ))}

              <Pressable onPress={() => addSet(exIndex)} style={styles.addSet}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.addSetText}>Añadir serie</Text>
              </Pressable>
            </Card>
          );
        })}

        <Text style={styles.hint}>Mantén pulsado el número de una serie para borrarla.</Text>

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            title="Añadir ejercicio"
            icon="add"
            variant="secondary"
            onPress={() => router.push('/elegir-ejercicio')}
          />
          <Button title="Terminar entrenamiento" icon="checkmark-done" onPress={finish} />
          <Button title="Descartar" icon="trash" variant="danger" onPress={discard} />
        </View>
      </ScrollView>

      {restEndsAt && (
        <View style={[styles.rest, { paddingBottom: insets.bottom + spacing.md }]}>
          <Ionicons name="timer-outline" size={22} color={colors.primaryText} />
          <Text style={styles.restText}>Descanso {formatClock(restLeft)}</Text>
          <Pressable onPress={() => setRestEndsAt(Math.max(Date.now(), restEndsAt - 15000))} style={styles.restBtn}>
            <Text style={styles.restBtnText}>−15</Text>
          </Pressable>
          <Pressable onPress={() => setRestEndsAt(restEndsAt + 15000)} style={styles.restBtn}>
            <Text style={styles.restBtnText}>+15</Text>
          </Pressable>
          <Pressable onPress={() => setRestEndsAt(null)} style={styles.restBtn}>
            <Text style={styles.restBtnText}>Saltar</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 120 },
  finishText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', padding: 0 },
  summary: { color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  exCard: { marginBottom: spacing.md, paddingHorizontal: spacing.md },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  exName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  exMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  th: { color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  colIndex: { width: 44, alignItems: 'center' },
  colInput: { flex: 1 },
  colAction: { width: 44 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  setRowDone: { backgroundColor: 'rgba(198,244,50,0.08)' },
  setIndex: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  check: {
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  addSetText: { color: colors.primary, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  rest: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  restText: { flex: 1, color: colors.primaryText, fontWeight: '800', fontSize: 17 },
  restBtn: {
    backgroundColor: 'rgba(14,15,19,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  restBtnText: { color: colors.primaryText, fontWeight: '700' },
});
