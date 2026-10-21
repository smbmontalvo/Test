import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/ui';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS, allExercises, nameKey } from '../data/exercises';
import { useGym } from '../store/GymContext';
import { colors, radius, spacing } from '../theme';
import type { MuscleGroup } from '../types';

const OTHER = 'Otro';

// Form to create a custom exercise. Optional params prefill it:
// ?nombre=<text> (from a search with no results) and ?musculo=<group>.
export default function NewExerciseScreen() {
  const params = useLocalSearchParams<{ nombre?: string; musculo?: string }>();
  const { addCustomExercise } = useGym();
  const [name, setName] = useState(params.nombre ?? '');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(
    MUSCLE_GROUPS.find((m) => m === params.musculo) ?? null,
  );
  const [equipment, setEquipment] = useState<string | null>(null);
  const [otherEquipment, setOtherEquipment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const key = nameKey(name);
  const duplicate = key !== '' && allExercises().some((e) => nameKey(e.name) === key);
  const nameError = duplicate
    ? 'Ya existe un ejercicio con ese nombre.'
    : submitted && key === ''
      ? 'Escribe un nombre para el ejercicio.'
      : null;
  const muscleError = submitted && !muscle ? 'Elige el grupo muscular.' : null;

  const save = () => {
    setSubmitted(true);
    if (key === '' || duplicate || !muscle) return;
    const chosen = equipment === OTHER ? otherEquipment.trim() : equipment;
    addCustomExercise({ name: name.trim().replace(/\s+/g, ' '), muscle, equipment: chosen || 'Otro' });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label} nativeID="label-exercise-name">
            Nombre
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej.: Press en máquina Smith"
            placeholderTextColor={colors.muted}
            style={[styles.input, nameError && styles.inputError]}
            autoCapitalize="sentences"
            autoFocus={!params.nombre}
            returnKeyType="done"
            accessibilityLabelledBy="label-exercise-name"
            accessibilityLabel="Nombre del ejercicio"
            accessibilityHint={nameError ?? undefined}
          />
          {nameError && (
            <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
              {nameError}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Grupo muscular</Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Grupo muscular">
            {MUSCLE_GROUPS.map((m) => (
              <Choice key={m} label={m} selected={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </View>
          {muscleError && (
            <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
              {muscleError}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Equipo <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Equipo">
            {[...EQUIPMENT_OPTIONS, OTHER].map((opt) => (
              <Choice
                key={opt}
                label={opt}
                selected={equipment === opt}
                onPress={() => setEquipment(equipment === opt ? null : opt)}
              />
            ))}
          </View>
          {equipment === OTHER && (
            <TextInput
              value={otherEquipment}
              onChangeText={setOtherEquipment}
              placeholder="¿Qué equipo usas?"
              placeholderTextColor={colors.muted}
              style={[styles.input, { marginTop: spacing.sm }]}
              autoFocus
              returnKeyType="done"
              accessibilityLabel="Otro equipo"
            />
          )}
        </View>

        <Button title="Guardar ejercicio" icon="checkmark" size="lg" onPress={save} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipActive, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.chipText, selected && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.xl },
  field: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  optional: { color: colors.muted, fontWeight: '400' },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 17,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.dangerText, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
