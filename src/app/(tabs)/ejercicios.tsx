import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { showAlert } from '../../components/Dialog';
import { Button, Card, Chip, EmptyState } from '../../components/ui';
import { MUSCLE_GROUPS, allExercises } from '../../data/exercises';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import type { Exercise, MuscleGroup } from '../../types';
import { personalRecords } from '../../utils/stats';

export default function ExercisesScreen() {
  const { history, deleteCustomExercise } = useGym();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const prs = useMemo(() => personalRecords(history), [history]);

  // Includes the user's own exercises; GymProvider keeps that list in sync and
  // re-renders this screen when it changes.
  const filtered = allExercises().filter(
    (e) => (!muscle || e.muscle === muscle) && e.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

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
    <FlatList
      data={filtered}
      keyExtractor={(e) => e.id}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ejercicio…"
            placeholderTextColor={colors.muted}
            style={styles.search}
            accessibilityLabel="Buscar ejercicio"
          />
          <Button
            title="Crear ejercicio"
            icon="add"
            onPress={() => create()}
            accessibilityLabel="Crear tu propio ejercicio"
            style={{ alignSelf: 'flex-start' }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <Chip label="Todos" active={muscle === null} onPress={() => setMuscle(null)} />
            {MUSCLE_GROUPS.map((m) => (
              <Chip key={m} label={m} active={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <View>
          <EmptyState icon="search" title="Sin resultados" text="Prueba con otro nombre o grupo, o créalo tú." />
          {query.trim() !== '' && (
            <Button
              title={`Crear «${query.trim()}»`}
              icon="add"
              onPress={() => create(query.trim())}
              style={{ alignSelf: 'center' }}
            />
          )}
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const pr = prs[item.id];
        return (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.custom && (
                  <View style={styles.mine} accessibilityLabel="Creado por ti">
                    <Text style={styles.mineText}>Tuyo</Text>
                  </View>
                )}
              </View>
              <Text style={styles.meta}>
                {item.muscle} · {item.equipment}
              </Text>
            </View>
            {pr && (
              <View style={styles.pr}>
                <Text style={styles.prLabel}>PR</Text>
                <Text style={styles.prValue}>
                  {pr.weight} kg × {pr.reps}
                </Text>
              </View>
            )}
            {item.custom && (
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${item.name}`}
                style={({ pressed }) => [styles.trash, pressed && { opacity: 0.5 }]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            )}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40 },
  search: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  name: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  mine: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mineText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  trash: { marginLeft: spacing.md, padding: spacing.xs },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  pr: { alignItems: 'flex-end' },
  prLabel: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  prValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
