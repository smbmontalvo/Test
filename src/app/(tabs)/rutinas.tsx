import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { DayPicker, todayIndex, WEEK_DAYS } from '../../components/DayPicker';
import { FadeInUp, Pop, PressScale } from '../../components/motion';
import { Button, EmptyState } from '../../components/ui';
import { getExercise } from '../../data/exercises';
import { useScreenInsets } from '../../hooks/useScreenInsets';
import { useToday } from '../../hooks/useToday';
import { useGym } from '../../store/GymContext';
import { colors, muscleColors, radius, spacing } from '../../theme';
import type { Routine } from '../../types';
import { plannedMeta, routineMuscles } from '../../utils/routines';
import { routineForDay } from '../../utils/schedule';

// A routine's color comes from the first muscle group it trains.
function routineColor(r: Routine): string {
  const m = getExercise(r.exerciseIds[0] ?? '')?.muscle;
  return m ? muscleColors[m] : colors.accent;
}

// Short name for tight spaces: "Empuje (Pecho, …)" -> "Empuje".
function shortName(name: string): string {
  return name.replace(/\s*\(.*\)\s*$/, '').trim() || name;
}

export default function RoutinesScreen() {
  const inset = useScreenInsets();
  const now = useToday();
  const { routines, history, createRoutine, updateRoutine } = useGym();
  const [name, setName] = useState('');
  const today = todayIndex(now);

  const plannedDays = new Set(routines.flatMap((r) => r.days ?? []));

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createRoutine(trimmed);
    setName('');
    router.push(`/rutina/${id}`);
  };

  return (
    <FlatList
      data={routines}
      keyExtractor={(r) => r.id}
      contentContainerStyle={[styles.container, { paddingTop: inset.top + spacing.lg, paddingBottom: inset.bottom + 40 }]}
      scrollIndicatorInsets={{ top: inset.top, bottom: inset.bottom }}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Hero: the week at a glance, which routine falls on which day. */}
          <FadeInUp>
            <View style={styles.hero}>
              <View style={styles.heroEyebrowRow}>
                <Ionicons name="calendar" size={16} color={colors.primaryText} />
                <Text style={styles.heroEyebrow}>Tu plan semanal</Text>
              </View>
              <Text style={styles.heroTitle}>
                {routines.length} {routines.length === 1 ? 'rutina' : 'rutinas'} · {plannedDays.size}{' '}
                {plannedDays.size === 1 ? 'día' : 'días'}
              </Text>
              <View style={styles.plan}>
                {WEEK_DAYS.map((d, i) => {
                  const r = routineForDay(routines, i);
                  const isToday = i === today;
                  return (
                    <View
                      key={d.short}
                      style={[styles.planDay, isToday && styles.planDayToday]}
                      accessible
                      accessibilityLabel={`${d.long}${isToday ? ', hoy' : ''}: ${r ? r.name : 'descanso'}`}
                    >
                      <Text style={[styles.planLetter, isToday && styles.planTextToday]}>{d.short}</Text>
                      {r ? (
                        <Pop visible delay={200 + i * 50}>
                          <View style={[styles.planDot, { backgroundColor: routineColor(r) }]}>
                            <Text style={styles.planInitial}>{shortName(r.name).charAt(0).toUpperCase()}</Text>
                          </View>
                        </Pop>
                      ) : (
                        <View style={styles.planRest}>
                          <Ionicons name="moon" size={12} color={isToday ? colors.card : 'rgba(20,22,27,0.45)'} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={styles.legend}>
                {routines
                  .filter((r) => r.days && r.days.length > 0)
                  .map((r) => (
                    <View key={r.id} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: routineColor(r) }]} />
                      <Text style={styles.legendText}>{shortName(r.name)}</Text>
                    </View>
                  ))}
              </View>
            </View>
          </FadeInUp>

          {/* New routine */}
          <FadeInUp delay={80}>
            <View style={styles.createCard}>
              <View style={styles.createIcon}>
                <Ionicons name="add" size={20} color={colors.accent} />
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nueva rutina…"
                placeholderTextColor={colors.muted}
                style={[styles.createInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
                onSubmitEditing={create}
                returnKeyType="done"
                accessibilityLabel="Nombre de la nueva rutina"
              />
              <Button title="Crear" onPress={create} disabled={!name.trim()} />
            </View>
          </FadeInUp>

          <Text style={styles.sectionTitle} accessibilityRole="header">
            Tus rutinas <Text style={styles.sectionCount}>{routines.length}</Text>
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="barbell-outline" title="Sin rutinas" text="Crea tu primera rutina arriba para empezar." />
      }
      renderItem={({ item, index }) => {
        const muscles = routineMuscles(item);
        const isToday = item.days?.includes(today) ?? false;
        const names = item.exerciseIds.map((id) => getExercise(id)?.name).filter(Boolean);
        return (
          <FadeInUp delay={140 + Math.min(index, 5) * 60}>
            <PressScale
              pressedScale={0.98}
              onPress={() => router.push(`/rutina/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}. ${plannedMeta(item, history)}. Editar rutina`}
              style={[styles.card, isToday && styles.cardToday]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: routineColor(item) }]}>
                  <Ionicons name="barbell" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{plannedMeta(item, history)}</Text>
                </View>
                {isToday && (
                  <View style={styles.todayPill}>
                    <Text style={styles.todayText}>HOY</Text>
                  </View>
                )}
              </View>

              {muscles.length > 0 ? (
                <View style={styles.muscles}>
                  {muscles.map((m) => (
                    <View key={m} style={styles.muscleChip}>
                      <View style={[styles.muscleDot, { backgroundColor: muscleColors[m] }]} />
                      <Text style={styles.muscleText}>{m}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text style={styles.exercises} numberOfLines={2}>
                {names.length > 0 ? names.join(' · ') : 'Sin ejercicios todavía. Toca para añadirlos.'}
              </Text>

              <View style={styles.daysBlock}>
                <Text style={styles.daysLabel}>Días que la entrenas</Text>
                <DayPicker value={item.days} onChange={(days) => updateRoutine(item.id, { days })} />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Editar ejercicios</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.accent} />
              </View>
            </PressScale>
          </FadeInUp>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg },
  header: { gap: spacing.lg, marginBottom: spacing.md },

  hero: { backgroundColor: colors.primary, borderRadius: 28, padding: spacing.xl, gap: spacing.sm },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: { color: colors.primaryText, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { color: colors.primaryText, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  plan: { flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginTop: spacing.sm },
  planDay: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  planDayToday: { backgroundColor: colors.primaryText },
  planLetter: { color: colors.primaryText, fontSize: 12, fontWeight: '800' },
  planTextToday: { color: colors.card },
  planDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  planInitial: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  planRest: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.primaryText, fontSize: 13, fontWeight: '700' },

  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  createIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  createInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 16, fontWeight: '600', paddingVertical: 10 },

  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginTop: spacing.sm },
  sectionCount: { color: colors.muted, fontSize: 16, fontWeight: '700' },

  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardToday: { borderWidth: 1.5, borderColor: colors.accent },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  todayPill: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  todayText: { color: colors.primaryText, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  muscleDot: { width: 8, height: 8, borderRadius: 4 },
  muscleText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  exercises: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  daysBlock: { gap: spacing.sm, backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.md },
  daysLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  footerText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
});
