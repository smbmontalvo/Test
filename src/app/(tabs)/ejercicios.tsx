import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Chip, EmptyState } from '../../components/ui';
import { EXERCISES, MUSCLE_GROUPS } from '../../data/exercises';
import { useGym } from '../../store/GymContext';
import { colors, radius, spacing } from '../../theme';
import type { MuscleGroup } from '../../types';
import { personalRecords } from '../../utils/stats';

export default function ExercisesScreen() {
  const { history } = useGym();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const prs = useMemo(() => personalRecords(history), [history]);

  const filtered = EXERCISES.filter(
    (e) => (!muscle || e.muscle === muscle) && e.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

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
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <Chip label="Todos" active={muscle === null} onPress={() => setMuscle(null)} />
            {MUSCLE_GROUPS.map((m) => (
              <Chip key={m} label={m} active={muscle === m} onPress={() => setMuscle(m)} />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<EmptyState icon="search" title="Sin resultados" text="Prueba con otro nombre o grupo." />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const pr = prs[item.id];
        return (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
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
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  pr: { alignItems: 'flex-end' },
  prLabel: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  prValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
